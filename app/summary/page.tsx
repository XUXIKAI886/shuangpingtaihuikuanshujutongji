import LoginGate from "@/app/components/LoginGate";
import SummaryTrendsPage from "@/app/components/SummaryTrendsPage";

export default function SummaryPage() {
  return (
    <LoginGate>
      <SummaryTrendsPage />
    </LoginGate>
  );
}
