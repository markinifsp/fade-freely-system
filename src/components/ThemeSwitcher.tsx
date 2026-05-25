import { Moon, Sun, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, colorSchemes, ColorScheme } from "@/contexts/ThemeContext";

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { mode, colorScheme, toggleMode, setColorScheme } = useTheme();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMode}
        className="h-8 w-8"
        aria-label="Alternar tema"
      >
        {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Cor do tema">
            <Palette className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Cor do tema</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {colorSchemes.map((c) => (
            <DropdownMenuItem
              key={c.value}
              onClick={() => setColorScheme(c.value as ColorScheme)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span
                className="w-4 h-4 rounded-full border border-border"
                style={{ background: c.swatch }}
              />
              <span className="flex-1">{c.label}</span>
              {colorScheme === c.value && <span className="text-xs text-primary">●</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
