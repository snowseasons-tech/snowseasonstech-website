import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function ArrowIcon({ size = 18, ...props }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...props}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}
export function ShieldIcon({ size = 28, ...props }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...props}><path d="M12 3l8 3v5c0 5-3.2 8.4-8 10-4.8-1.6-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
}
export function CpuIcon({ size = 28, ...props }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...props}><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" /><path d="M10 10h4v4h-4z" /></svg>;
}
export function CloudIcon({ size = 28, ...props }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...props}><path d="M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6 9.5 4.5 4.5 0 0 0 7 18Z" /></svg>;
}
export function CodeIcon({ size = 28, ...props }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...props}><path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 6l-4 12" /></svg>;
}
export function DatabaseIcon({ size = 28, ...props }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...props}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" /></svg>;
}
export function TerminalIcon({ size = 28, ...props }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...props}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3M13 15h4" /></svg>;
}
export function MenuIcon({ size = 24, ...props }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...props}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
}
export function XIcon({ size = 24, ...props }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...props}><path d="m6 6 12 12M18 6 6 18" /></svg>;
}
export function CheckIcon({ size = 18, ...props }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...props}><path d="m5 12 4 4L19 6" /></svg>;
}
