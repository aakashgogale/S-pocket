// ADD THIS import at top
import { setupMFA } from "../middleware/auth.middleware.js";

// ADD THIS route before export
router.post("/setup-mfa", protect, setupMFA);