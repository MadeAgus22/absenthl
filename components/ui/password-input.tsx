"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input, type InputProps } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input
          type={isVisible ? "text" : "password"}
          className={cn("pr-10", className)} // Tambahkan padding kanan untuk ruang ikon
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
          onClick={() => setIsVisible(!isVisible)}
          tabIndex={-1} // Agar tidak terfokus saat menekan tombol Tab
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          <span className="sr-only">
            {isVisible ? "Sembunyikan password" : "Tampilkan password"}
          </span>
        </Button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };