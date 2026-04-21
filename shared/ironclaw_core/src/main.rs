mod inference;

use anyhow::Result;
use wasmtime::*;
use wasmtime::component::Linker;
use wasmtime_wasi::{WasiCtx, WasiCtxBuilder, WasiView, DirPerms, FilePerms};
use std::path::PathBuf;
use regex::Regex;
use std::env;
use crate::inference::LLMInference;

pub struct IronClawConfig {
    pub sandbox_root: PathBuf,
    pub forbid_patterns: Vec<String>,
    pub model: String,
}

struct MyCtx {
    wasi: WasiCtx,
    table: wasmtime_wasi::ResourceTable,
}

impl WasiView for MyCtx {
    fn ctx(&mut self) -> &mut WasiCtx {
        &mut self.wasi
    }
    fn table(&mut self) -> &mut wasmtime_wasi::ResourceTable {
        &mut self.table
    }
}

pub struct HardenedRuntime {
    engine: Engine,
    config: IronClawConfig,
    llm: LLMInference,
}

impl HardenedRuntime {
    pub fn new(config: IronClawConfig) -> Result<Self> {
        let mut engine_config = Config::new();
        engine_config.wasm_component_model(true);
        let engine = Engine::new(&engine_config)?;
        let llm = LLMInference::new(&config.model);
        
        Ok(Self { engine, config, llm })
    }

    pub async fn execute(&self, message: &str) -> Result<String> {
        println!("🛡️ IronClaw Hardened Runtime: Processing task...");
        
        // 1. LLM 推論の実行
        let output = self.llm.generate(message).await?;
        
        // 2. 出力バリデーション（物理的制約）
        self.verify_output_safety(&output)?;

        Ok(output)
    }

    fn verify_output_safety(&self, text: &str) -> Result<()> {
        for pattern in &self.config.forbid_patterns {
            let re = Regex::new(pattern)?;
            if re.is_match(text) {
                return Err(anyhow::anyhow!("🚨 SECURITY BREACH: Illegal pattern found in output!"));
            }
        }
        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let args: Vec<String> = env::args().collect();
    
    if args.contains(&"-m".to_string()) {
        let index = args.iter().position(|r| r == "-m").unwrap();
        if let Some(message) = args.get(index + 1) {
            let config = IronClawConfig {
                sandbox_root: env::current_dir()?,
                forbid_patterns: vec![r"\.env".to_string()],
                model: "qwen2.5:3b".to_string(),
            };
            let runtime = HardenedRuntime::new(config)?;
            match runtime.execute(message).await {
                Ok(result) => {
                    println!("{}", result);
                }
                Err(e) => {
                    eprintln!("❌ IronClaw Core Error: {}", e);
                    std::process::exit(1);
                }
            }
            return Ok(());
        }
    }

    println!("Usage: ironclaw_core run -m \"<instruction>\"");
    Ok(())
}
