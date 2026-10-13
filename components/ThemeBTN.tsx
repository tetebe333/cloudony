'use client'

import { useAppStore } from "@/store/appStore";
import { Moon, Sun  } from 'lucide-react';

export default function ThemeBTN() {
    const theme = useAppStore((state) => state.theme);
    const toggleTheme = useAppStore((state) => state.toggleTheme);
    return(
        <button onClick={toggleTheme}
             className={`rounded-full p-2 ${theme === "light" ? "bg-[#DEE4F3]" : "bg-transparent"}`}>
            {theme === "light" ? <Moon size={19} strokeWidth={2.5} /> : <Sun className="text-yellow-600"  size={20} strokeWidth={3} />}
          </button>
    );
}