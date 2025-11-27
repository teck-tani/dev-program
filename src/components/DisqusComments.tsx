'use client';

import { useEffect } from 'react';

interface DisqusCommentsProps {
    identifier: string;
    title: string;
}

export default function DisqusComments({ identifier, title }: DisqusCommentsProps) {
    useEffect(() => {
        // Disqus configuration
        const disqusConfig = function (this: any) {
            this.page.url = window.location.href;
            this.page.identifier = identifier;
            this.page.title = title;
        };

        // Set the config on window object
        (window as any).disqus_config = disqusConfig;

        // Load Disqus script
        const script = document.createElement('script');
        script.src = 'https://tani-devtool.disqus.com/embed.js';
        script.setAttribute('data-timestamp', String(+new Date()));
        (document.head || document.body).appendChild(script);

        // Cleanup function
        return () => {
            // Remove Disqus when component unmounts
            const disqusThread = document.getElementById('disqus_thread');
            if (disqusThread) {
                disqusThread.innerHTML = '';
            }
        };
    }, [identifier, title]);

    return (
        <section className="comments-section" style={{ marginTop: '50px', padding: '20px 0' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                <div id="disqus_thread"></div>
                <noscript>댓글을 보려면 자바스크립트를 활성화해주세요</noscript>
            </div>
        </section>
    );
}
