export function pfGetSessionTicket () {
    // create login from hashed IP
    return fetch('https://www.cloudflare.com/cdn-cgi/trace')
        .then(data => {
            return data.text();
        })
        .then(text => {
            const ip = text.slice(text.indexOf('ip=') + 3, text.indexOf('ts='));
            return crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
        })
        .then(digest => {
            const hash = Array.prototype.map.call(new Uint8Array(digest), x => ("0" + x.toString(16)).slice(-2)).join("");
            return axios.post(`https://4eeea.playfabapi.com/Client/LoginWithCustomID`, { titleId: '4eeea', CreateAccount: true, CustomId: hash }, { headers: { 'Content-Type': 'application/json' } });
        })
        .then(response => {
            const session_ticket = response.data.data.SessionTicket;
            const player_id = response.data.data.PlayFabId;
            return { session_ticket: session_ticket, player_id: player_id };
        })
        .catch(error => console.log(error));
}

export function pfSubmitScore (session_ticket, score, leaderboard) {
    return axios.post(`https://4eeea.playfabapi.com/Client/UpdatePlayerStatistics`, { 'Statistics': [ { 'StatisticName': leaderboard, 'Value': score } ] }, { headers: { 'Content-Type': 'application/json', 'X-Authorization': session_ticket } })
        .catch(error => {
            console.log(error);
        })
}

export function pfGetLeaderboard (session_ticket, leaderboard, limit) {
    return axios.post(`https://4eeea.playfabapi.com/Client/GetLeaderboard`, { 'StatisticName': leaderboard }, { headers: { 'Content-Type': 'application/json', 'X-Authorization': session_ticket } })
        .then(data => {
            const leaderboardEntries = data.data.data.Leaderboard.slice(0, limit);
            return leaderboardEntries;
        })
}