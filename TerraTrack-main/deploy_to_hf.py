import os
import sys

def main():
    print("====================================================")
    print("   TERRATRACK DEPLOYMENT ASSISTANT (Hugging Face)   ")
    print("====================================================\n")
    
    # 1. Install huggingface_hub if missing
    try:
        from huggingface_hub import HfApi, login
    except ImportError:
        print("Installing huggingface_hub helper package...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "huggingface_hub", "-q"])
        from huggingface_hub import HfApi, login

    print("To deploy your project to Hugging Face Spaces for free:")
    print("1. Sign up/Log in on https://huggingface.co/")
    print("2. Go to https://huggingface.co/settings/tokens")
    print("3. Create a 'Write' token and copy it.\n")
    
    token = input("Enter your Hugging Face WRITE Token: ").strip()
    if not token:
        print("❌ Token is required for deployment.")
        return
        
    try:
        # Authenticate
        login(token)
        api = HfApi(token=token)
        
        # Get username
        user_info = api.whoami()
        username = user_info['name']
        print(f"\n✅ Authenticated successfully as user: {username}")
        
        default_space_name = "terratrack-monitor"
        space_name = input(f"Enter Space name [default: {default_space_name}]: ").strip()
        if not space_name:
            space_name = default_space_name
            
        repo_id = f"{username}/{space_name}"
        print(f"\nCreating Hugging Face Space '{repo_id}' using Docker SDK...")
        
        # Create Space repo
        api.create_repo(
            repo_id=repo_id,
            repo_type="space",
            space_sdk="docker",
            private=False,
            exist_ok=True
        )
        
        print("Uploading project files (this may take a few seconds)...")
        # Upload folder directly (excluding unnecessary files)
        api.upload_folder(
            folder_path=".",
            repo_id=repo_id,
            repo_type="space",
            ignore_patterns=[
                "venv/*",
                "model/*",
                "*.pth",
                "*.ipynb",
                "*.log",
                "__pycache__/*",
                ".git/*",
                ".agents/*",
                "deploy_to_hf.py"
            ]
        )
        
        space_url = f"https://huggingface.co/spaces/{repo_id}"
        print("\n====================================================")
        print("🎉 SUCCESS! Your application is deploying!")
        print("====================================================")
        print(f"Deployment link: {space_url}")
        print("\nHugging Face will build the Docker container and start your app.")
        print("This takes 2-4 minutes on the first deploy.")
        print("Anyone can access the link above from any device!")
        print("\nNote: By default, the deployed link will run in DEMO mode.")
        print("If you want to enable live Earth Engine satellite data:")
        print("1. Go to your Space settings on Hugging Face.")
        print("2. Under 'Variables and Secrets', add a new Secret named 'EE_SERVICE_ACCOUNT_KEY'.")
        print("3. Paste the contents of your Google Cloud Service Account JSON key file.")
        print("====================================================")
        
    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")

if __name__ == "__main__":
    main()
