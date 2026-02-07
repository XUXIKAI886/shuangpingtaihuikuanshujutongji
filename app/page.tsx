import ClientHome from "./components/ClientHome";
import LoginGate from "./components/LoginGate";

export default function Home() {
  return (
    <LoginGate>
      <ClientHome />
    </LoginGate>
  );
}
