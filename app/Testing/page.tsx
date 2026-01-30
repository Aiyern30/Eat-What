"use client";

import WheelComponent from "@/components/WheelComponents";
import { useRouter } from "next/navigation";

export default function App() {
  const router = useRouter();

  const segments = ["Varejo", "Logística", "Operacional"];
  const segColors = ["#faa230", "#055cba", "#bb1625"];

  const onFinished = (winner: string) => {
    console.log(winner);
    setTimeout(() => {
      router.push(`/${winner}`);
    }, 600);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="max-w-2xl w-full flex flex-col items-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <WheelComponent
            segments={segments}
            segColors={segColors}
            onFinished={onFinished}
            primaryColor="#4E4F50"
            contrastColor="white"
            buttonText="Girar"
            isOnlyOnce={false}
            size={170}
            upDuration={50}
            downDuration={600}
            fontFamily="Arial"
          />
        </div>
      </div>
    </div>
  );
}
