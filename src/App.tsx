import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Musicas from "./pages/Musicas";
import Slides from "./pages/Slides";
import Escalas from "./pages/Escalas";
import Liturgia from "./pages/Liturgia";
import Auth from "./pages/Auth";
import UserApprovals from "./pages/UserApprovals";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/musicas" element={<Layout><Musicas /></Layout>} />
            <Route path="/slides" element={<Layout><Slides /></Layout>} />
            <Route path="/escalas" element={<Layout><Escalas /></Layout>} />
            <Route path="/liturgia" element={<Layout><Liturgia /></Layout>} />
            <Route path="/user-approvals" element={<Layout><UserApprovals /></Layout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
