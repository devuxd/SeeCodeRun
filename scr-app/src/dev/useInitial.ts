import {useEffect, useState} from "react";
import {InitialHookStatus} from "@react-buddy/ide-toolbox";

export const useInitial: () => InitialHookStatus = () => {
    const [status, setStatus] = useState<InitialHookStatus>({
        loading: false,
        error: false,
    });
    useEffect(() => {
        console.log("useInitial", status);
    }, [status]);
    /*
      Implement hook functionality here.
      If you need to execute async operation, set loading to true and when it's over, set loading to false.
      If you caught some errors, set error status to true.
      Initial hook is considered to be successfully completed if it will return {loading: false, error: false}.
    */
    return status;
};
