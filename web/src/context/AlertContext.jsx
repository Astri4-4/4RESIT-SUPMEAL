import {createContext, useCallback, useContext, useRef, useState} from "react";
import Alert from "../components/ui/Alert.jsx";

const AlertContext = createContext(null);

const ALERT_DURATION_MS = 5000;

let idCounter = 0;

export function AlertProvider({children}) {

    const [alerts, setAlerts] = useState([]);
    const timers = useRef({});

    const dismissAlert = useCallback((id) => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
        clearTimeout(timers.current[id]);
        delete timers.current[id];
    }, []);

    const showAlert = useCallback((message, type = "success") => {
        const id = ++idCounter;
        setAlerts((prev) => [...prev, {id, message, type}]);
        timers.current[id] = setTimeout(() => dismissAlert(id), ALERT_DURATION_MS);
        return id;
    }, [dismissAlert]);

    const showSuccess = useCallback((message) => showAlert(message, "success"), [showAlert]);
    const showError = useCallback((message) => showAlert(message, "error"), [showAlert]);

    return (
        <AlertContext.Provider value={{showAlert, showSuccess, showError, dismissAlert}}>
            {children}

            <div className={"fixed top-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none"}>
                {alerts.map((alert) => (
                    <div key={alert.id} className={"animate-toast-in pointer-events-auto cursor-pointer"} onClick={() => dismissAlert(alert.id)}>
                        <Alert type={alert.type} message={alert.message} />
                    </div>
                ))}
            </div>
        </AlertContext.Provider>
    );
}

export const useAlert = () => {
    const ctx = useContext(AlertContext);
    if (!ctx) throw new Error("useAlert doit être utilisé dans un AlertProvider");
    return ctx;
};
