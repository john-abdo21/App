import {useEffect, useRef} from 'react';

/**
 * @param {Function} onPageLoad
 * @param {Array} dependencies
 */
export default function useEffectOnPageLoad(onPageLoad, dependencies = []) {
    const onPageLoadRef = useRef(onPageLoad);
    onPageLoadRef.current = onPageLoad;

    useEffect(() => {
        function onPageLoadCallback() {
            onPageLoadRef.current();
        }

        if (document.readyState === 'complete') {
            onPageLoadCallback();
        } else {
            window.removeEventListener('load', onPageLoadRef.current);
            window.addEventListener('load', onPageLoadRef.current);
            return () => window.removeEventListener('load', onPageLoadRef.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
}
