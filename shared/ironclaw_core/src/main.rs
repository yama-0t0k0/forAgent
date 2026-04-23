use anyhow::{Result, anyhow};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::io::{self, Read};

// ツール呼び出し用スキーマ
#[derive(Deserialize, Serialize, Debug)]
#[serde(tag = "name", content = "arguments")]
#[allow(non_camel_case_types)]
enum ToolCall {
    write_file { path: String, content: String },
    read_file { path: String },
    run_command { command: String, cwd: String },
    github_comment { issue_number: u32, body: String },
    github_close_issue { issue_number: u32 },
}

/// IronClaw Safety Guard — Output Censorship Filter
///
/// 役割: オーケストレーター（pm_orchestrator.js）から pipe 経由で
/// LLM の出力テキストを受け取り、機密情報パターンを検出して遮断する。
/// 安全な出力のみを stdout に通過させる純粋なフィルタ。
///
/// 使い方:
///   echo "LLM output" | ironclaw_core filter
///   echo '{"text":"...", "patterns":["regex1"]}' | ironclaw_core filter --json
///   echo '[{"name":"read_file","arguments":{"path":"..."}}]' | ironclaw_core filter --validate-tool

#[derive(Deserialize)]
struct FilterInput {
    text: String,
    #[serde(default = "default_patterns")]
    patterns: Vec<String>,
}

fn default_patterns() -> Vec<String> {
    vec![
        r"(?i)FIREBASE_SERVICE_ACCOUNT".to_string(),
        r"(?i)FIREBASE_API_KEY\s*=".to_string(),
        r"(?i)GITHUB_TOKEN\s*=".to_string(),
        r"(?i)-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----".to_string(),
        r#"(?i)password\s*[:=]\s*['"][^'"]+['"]"#.to_string(),
        r"\.env".to_string(),
        r"id_rsa".to_string(),
        r"credentials\.json".to_string(),
    ]
}

fn verify_output_safety(text: &str, patterns: &[String]) -> Result<()> {
    for pattern in patterns {
        let re = Regex::new(pattern)
            .map_err(|e| anyhow!("Invalid regex pattern '{}': {}", pattern, e))?;
        if re.is_match(text) {
            return Err(anyhow!(
                "🚨 SECURITY BREACH BLOCKED: Forbidden pattern '{}' detected in output. Transmission halted.",
                pattern
            ));
        }
    }
    Ok(())
}

fn main() -> Result<()> {
    let args: Vec<String> = std::env::args().collect();

    if args.len() < 2 || args[1] != "filter" {
        eprintln!("IronClaw Safety Guard v0.2.0");
        eprintln!("Usage:");
        eprintln!("  echo \"text\" | ironclaw_core filter          # Plain text mode");
        eprintln!("  echo '{{\"text\":\"..\"}}' | ironclaw_core filter --json  # JSON mode");
        eprintln!("  echo '[{{\"name\":\"..\",\"arguments\":{{..}}}}]' | ironclaw_core filter --validate-tool # JSON tool validation");
        std::process::exit(1);
    }

    let json_mode = args.contains(&"--json".to_string());
    let validate_tool_mode = args.contains(&"--validate-tool".to_string());

    // Read all input from stdin
    let mut input = String::new();
    io::stdin().read_to_string(&mut input)?;

    if input.trim().is_empty() {
        return Err(anyhow!("No input received on stdin"));
    }

    if validate_tool_mode {
        // Physical JSON validation via serde
        // Support array, single object, or {"tool_calls": [...]}
        let parse_result: Result<serde_json::Value, serde_json::Error> = serde_json::from_str(&input);
        match parse_result {
            Ok(value) => {
                let tool_calls_result: Result<Vec<ToolCall>, serde_json::Error> = if value.is_array() {
                    serde_json::from_value(value)
                } else if value.is_object() {
                    if let Some(calls) = value.get("tool_calls") {
                        serde_json::from_value(calls.clone())
                    } else {
                        serde_json::from_value(value).map(|v| vec![v])
                    }
                } else {
                    serde_json::from_value(value)
                };

                match tool_calls_result {
                    Ok(calls) => {
                        let patterns = default_patterns();
                        if let Err(e) = verify_output_safety(&input, &patterns) {
                            eprintln!("{}", e);
                            std::process::exit(1);
                        }
                        // Output the normalized JSON array back
                        print!("{}", serde_json::to_string(&calls).unwrap_or(input.clone()));
                    }
                    Err(e) => {
                        eprintln!("JSON_VALIDATION_ERROR: Invalid tool call schema. Error: {}", e);
                        eprintln!("Expected schema: JSON Array of tool objects.");
                        eprintln!("Valid Tools: \n - write_file {{path, content}}\n - read_file {{path}}\n - run_command {{command, cwd}}\n - github_comment {{issue_number, body}}\n - github_close_issue {{issue_number}}");
                        std::process::exit(1);
                    }
                }
            }
            Err(e) => {
                eprintln!("JSON_VALIDATION_ERROR: {}", e);
                std::process::exit(1);
            }
        }
    } else if json_mode {
        // JSON mode: parse structured input with custom patterns
        let filter_input: FilterInput = serde_json::from_str(&input)
            .map_err(|e| anyhow!("Invalid JSON input: {}", e))?;

        verify_output_safety(&filter_input.text, &filter_input.patterns)?;
        print!("{}", filter_input.text);
    } else {
        // Plain text mode: use default patterns
        let patterns = default_patterns();
        verify_output_safety(&input, &patterns)?;
        print!("{}", input);
    }

    Ok(())
}
