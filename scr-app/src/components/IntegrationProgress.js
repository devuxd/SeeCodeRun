import {useEffect, useRef, useState} from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import {green} from '@mui/material/colors';
import AlarmOffIcon from '@mui/icons-material/AlarmOff';
import AlarmOnIcon from '@mui/icons-material/AlarmOn';

export default function CircularIntegration({autorunDelay = "0", steps = 10}) {
    const [progressValue, setProgressValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const timer = useRef();

    useEffect(() => {
        if (success) return;

        if (!loading) {
            setSuccess(false);
            setLoading(true);
            setProgressValue(0);

            const delay = parseInt(autorunDelay, 10) / steps; // Ensure autorunDelay is treated as an integer
            let step = 0;

            clearInterval(timer.current);
            timer.current = setInterval(() => {
                if (step < steps) {
                    step++;
                    setProgressValue((step * 100) / steps);
                } else {
                    setSuccess(true);
                    setLoading(false);
                    clearInterval(timer.current);
                }
            }, delay);
        }

    }, [success, loading, autorunDelay, steps]);

    useEffect(() => {
        return () => {
            if (timer.current) {
                clearInterval(timer.current);
            }
        };
    }, []);


    return (
        <Box sx={{display: 'flex', alignItems: 'center'}}>
            <Box sx={{m: 1, position: 'relative'}}>
                <IconButton
                    color={success ? "success" : "disabled"}
                    size={"small"}
                    disableRipple
                    disableFocusRipple
                    // disableElevation
                    title={success ? "Running" : "Waiting to rerun"}
                >
                    {success ? <AlarmOnIcon/> : <AlarmOffIcon/>}
                </IconButton>
                {loading && (
                    <CircularProgress
                        variant="determinate"
                        value={progressValue}
                        size={30}
                        sx={{
                            color: green[500],
                            position: 'absolute',
                            top: 2,
                            left: 2,
                            zIndex: 1,
                        }}
                    />
                )}
            </Box>
        </Box>
    );
}
