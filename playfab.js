export function pfRegister () {
    fetch('https://www.cloudflare.com/cdn-cgi/trace')
        .then(data => {
            console.log(JSON.stringify(data));
        });
    console.log(`Registered!`);
}