import { BrowserRouter, Routes, Route } from "react-router-dom";
import GoogleSignIn from "./auth/googleSignIn";
import "./index.css";
import InvoiceDashboard from "./components/dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GoogleSignIn />} />
        <Route path="/dashboard" element={<InvoiceDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
