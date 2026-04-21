use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};
use reqwest::Client;

#[derive(Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Deserialize)]
struct OllamaResponse {
    response: String,
}

pub struct LLMInference {
    client: Client,
    model: String,
}

impl LLMInference {
    pub fn new(model: &str) -> Self {
        Self {
            client: Client::new(),
            model: model.to_string(),
        }
    }

    pub async fn generate(&self, prompt: &str) -> Result<String> {
        let base_url = env::var("OLLAMA_URL")
            .unwrap_or_else(|_| "http://host.containers.internal:11434".to_string());
        let url = format!("{}/api/generate", base_url);
        
        let request = OllamaRequest {
            model: self.model.clone(),
            prompt: prompt.to_string(),
            stream: false,
        };

        let res = self.client.post(url)
            .json(&request)
            .send()
            .await?;

        if !res.status().is_success() {
            return Err(anyhow!("Ollama API error: {}", res.status()));
        }

        let response_data: OllamaResponse = res.json().await?;
        let text = response_data.response.trim();

        if text.is_empty() {
            return Err(anyhow!("EMPTY_RESPONSE: Model returned no content"));
        }

        Ok(text.to_string())
    }
}
