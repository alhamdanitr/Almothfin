import { useNavigate } from "react-router-dom";
import { SmartEntryModal } from "../components/SmartEntryModal";
export default function SmartChat() {
  const navigate = useNavigate();
  return <SmartEntryModal fullPage onClose={() => navigate("/")} />;
}
