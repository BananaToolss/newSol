import React, { createContext, useContext, useState } from "react";

// 定义上下文的默认值类型
type StoreContextType = {
    netWork: string;
    setNetWork: React.Dispatch<React.SetStateAction<string>>;
};

// 提供默认值（可以是 null 或初始对象）
const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
    const [netWork, setNetWork] = useState("");

    return (
        <StoreContext.Provider value={{ netWork, setNetWork }}>
            {children}
        </StoreContext.Provider>
    );
};

// 自定义 Hook，添加非空断言，确保调用方在 Provider 内部
export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error("useStore must be used within a StoreProvider");
    }
    return context;
};
