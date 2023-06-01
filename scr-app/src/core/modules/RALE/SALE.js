// Styling ALE
// css content manager
import "./styles.css";
import React, { useState, useEffect } from "react";
import postcss from "postcss";
import postcssPresetEnv from "postcss-preset-env";

export default function App() {
    const [css, setCss] = useState(`
    body 
      background-color: red;
    }
  `);
    const [processedCss, setProcessedCss] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        postcss([postcssPresetEnv])
            .process(css, { from: undefined })
            .then((result) => {
                setProcessedCss(result.css);
                setError(null);
            })
            .catch((error) => {
                setProcessedCss("");
                setError(error);
            });
    }, [css]);

    return (
        <div className="App">
            <textarea value={css} onChange={(event) => setCss(event.target.value)} />
            {error ? (
                <div className="error">
                    <h3>PostCSS Error:</h3>
                    <p>
                        {error.name}: {error.reason}
                    </p>
                    {error.file && <p>File: {error.file}</p>}
                    {error.line && <p>Line: {error.line}</p>}
                    {error.column && <p>Column: {error.column}</p>}
                </div>
            ) : (
                "Ok."
            )}
            {processedCss && <style>{processedCss}</style>}
        </div>
    );
}
