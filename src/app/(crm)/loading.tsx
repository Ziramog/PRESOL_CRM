import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin relative z-10" />
      </div>
      <p className="text-gray-500 font-medium mt-4 text-sm animate-pulse">Cargando información...</p>
    </div>
  );
}
