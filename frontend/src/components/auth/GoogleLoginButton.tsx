import { GoogleLogin } from "@react-oauth/google";
import { AlertCircle } from "lucide-react";

interface GoogleLoginButtonProps {
  onToken: (token: string) => Promise<void> | void;
  onError: (message: string) => void;
}

export function GoogleLoginButton({ onToken, onError }: GoogleLoginButtonProps) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    return (
      <div className="w-full h-12 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive px-3 flex items-center gap-2 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" />
        Missing `VITE_GOOGLE_CLIENT_ID` in frontend environment.
      </div>
    );
  }

  return (
    <div
      className="w-full rounded-xl border border-border bg-background p-2 flex items-center justify-center"
      data-ocid="login.google_button"
    >
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (!credentialResponse.credential) {
            onError("Google login failed: missing ID token.");
            return;
          }
          onToken(credentialResponse.credential);
        }}
        onError={() => onError("Google login failed. Please try again.")}
        text="continue_with"
        shape="pill"
        size="large"
        theme="filled_black"
      />
    </div>
  );
}
