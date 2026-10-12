import os
import torch
from transformers import AutoModel, AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

class FinGPTEngine:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.is_loaded = False
        
        # --- ORIGINAL CONFIG (Commented out) ---
        # You can change the base model and peft model depending on your GPU limits
        # Llama-2-7b requires ~14GB VRAM in fp16, or ~7GB in 8-bit.
        # self.base_model_name = "NousResearch/Llama-2-7b-chat-hf"
        # self.peft_model_name = "FinGPT/fingpt-sentiment_llama2-13b_lora" # Or your specific FinGPT adapter

        # --- TEST LLM CONFIG ---
        # Using TinyLlama as it is small (1.1B), fast, and good for testing pipelines
        self.base_model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

    def load_model(self):
        if self.is_loaded:
            return
            
        print(f"[FinGPT] Downloading and loading {self.base_model_name}... This should be fast.")
        
        try:
            # We use float16 to save memory. Use load_in_8bit=True if you installed bitsandbytes
            self.tokenizer = AutoTokenizer.from_pretrained(self.base_model_name, trust_remote_code=True)
            self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # --- FORCE CPU FOR COMPATIBILITY ---
            # Since PyTorch 2.8 doesn't support the GTX 1070 (sm_61), we force CPU here. 
            # Once you downgrade PyTorch, you can change device_map to "auto"
            self.model = AutoModelForCausalLM.from_pretrained(
                self.base_model_name, 
                trust_remote_code=True, 
                device_map="cpu", 
                torch_dtype=torch.float32
            )
            
            # Note: FinGPT models are usually distributed as PEFT (LoRA) adapters
            # We load the adapter on top of the base model
            # --- COMMENTED OUT FOR TEST LLM ---
            # try:
            #     self.model = PeftModel.from_pretrained(base_model, self.peft_model_name)
            # except Exception as e:
            #     print(f"[FinGPT] Could not load PEFT adapter ({e}). Using base model instead.")
            #     self.model = base_model
                
            self.model.eval()
            self.is_loaded = True
            print("[FinGPT] Model successfully loaded!")
            
        except Exception as e:
            print(f"[FinGPT] Error loading model: {e}")
            self.is_loaded = False
            raise e

    def ask(self, prompt: str) -> str:
        if not self.is_loaded:
            self.load_model()
            
        # Format the prompt for FinGPT
        formatted_prompt = f"Instruction: As a financial expert, answer the following question.\nInput: {prompt}\nAnswer: "
        
        inputs = self.tokenizer(
            formatted_prompt, 
            return_tensors="pt", 
            padding=True, 
            truncation=True, 
            max_length=512
        )
        
        # Move inputs to the same device as the model
        device = next(self.model.parameters()).device
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=150,
                temperature=0.7,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )
            
        # Decode only the generated text (ignoring the prompt)
        input_length = inputs["input_ids"].shape[1]
        generated_tokens = outputs[0][input_length:]
        response = self.tokenizer.decode(generated_tokens, skip_special_tokens=True)
        
        return response.strip()

# Singleton instance
fingpt_engine = FinGPTEngine()
