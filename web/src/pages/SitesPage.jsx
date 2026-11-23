import { useSearchParams } from "react-router-dom";
import SitesExplorer from "../components/SitesExplorer.jsx";

/** Workspace site map: fills the app shell. The public copy lives on the home page. */
export function SitesPage() {
  const [params] = useSearchParams();
  return <SitesExplorer fill query={params.get("site") ?? ""} />;
}
