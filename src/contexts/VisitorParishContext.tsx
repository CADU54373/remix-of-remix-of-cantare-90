import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Parish {
  id: string;
  name: string;
}

interface VisitorParishContextType {
  visitorParishId: string | null;
  visitorParishName: string | null;
  setVisitorParish: (id: string | null, name: string | null) => void;
  clearVisitorParish: () => void;
  isVisitor: boolean;
}

const VisitorParishContext = createContext<VisitorParishContextType | undefined>(undefined);

export const VisitorParishProvider = ({ children }: { children: ReactNode }) => {
  const [visitorParishId, setVisitorParishId] = useState<string | null>(() => {
    return localStorage.getItem('visitor_parish_id');
  });
  const [visitorParishName, setVisitorParishName] = useState<string | null>(() => {
    return localStorage.getItem('visitor_parish_name');
  });

  const setVisitorParish = (id: string | null, name: string | null) => {
    setVisitorParishId(id);
    setVisitorParishName(name);
    if (id && name) {
      localStorage.setItem('visitor_parish_id', id);
      localStorage.setItem('visitor_parish_name', name);
    }
  };

  const clearVisitorParish = () => {
    setVisitorParishId(null);
    setVisitorParishName(null);
    localStorage.removeItem('visitor_parish_id');
    localStorage.removeItem('visitor_parish_name');
  };

  return (
    <VisitorParishContext.Provider
      value={{
        visitorParishId,
        visitorParishName,
        setVisitorParish,
        clearVisitorParish,
        isVisitor: !!visitorParishId,
      }}
    >
      {children}
    </VisitorParishContext.Provider>
  );
};

export const useVisitorParish = () => {
  const context = useContext(VisitorParishContext);
  if (context === undefined) {
    throw new Error("useVisitorParish must be used within a VisitorParishProvider");
  }
  return context;
};
