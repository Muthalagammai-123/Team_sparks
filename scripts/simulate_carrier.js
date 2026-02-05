const fetch = require('node-fetch');

async function simulate() {
    const carrierId = process.argv[2] || "fb1229db-3774-4619-89c8-7779138f3932";
    console.log(`Starting simulation for carrier: ${carrierId}`);

    // Predefined route for simulation (Chennai area)
    const route = [
        { lat: 13.0827, lng: 80.2707 },
        { lat: 13.0827, lng: 80.2907 }, // Move East
        { lat: 13.1027, lng: 80.2907 }, // Move North
        { lat: 13.1027, lng: 80.2707 }, // Move West
        { lat: 13.0827, lng: 80.2707 }, // Move South back to start
    ];

    let currentWaypoint = 0;
    let lat = route[0].lat;
    let lng = route[0].lng;
    let heading = 0;
    let counter = 0;

    const interval = setInterval(async () => {
        counter++;
        const nextWaypoint = (currentWaypoint + 1) % route.length;
        const target = route[nextWaypoint];

        // Cycle traffic: 15 ticks clear (~45s), 5 ticks congested (~15s)
        const isCongested = (counter % 20 > 15);
        const targetSpeed = isCongested ? 5 + Math.random() * 5 : 45 + Math.random() * 15;

        // Calculate move step
        const stepSize = (targetSpeed / 3600) * 0.05; // 0.05 degrees covers more ground for demo

        // Calculate vector
        const dLat = target.lat - lat;
        const dLng = target.lng - lng;
        const distance = Math.sqrt(dLat * dLat + dLng * dLng);

        if (distance < stepSize) {
            // Reached waypoint
            currentWaypoint = nextWaypoint;
            lat = target.lat;
            lng = target.lng;
        } else {
            // Move towards target
            lat += (dLat / distance) * stepSize;
            lng += (dLng / distance) * stepSize;

            // Update heading (degrees)
            heading = (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;
        }

        try {
            const response = await fetch('http://localhost:8000/carrier/live-location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    carrier_id: carrierId,
                    lat: lat,
                    lng: lng,
                    speed: targetSpeed,
                    heading: heading
                })
            });
            const result = await response.json();
            const statusIcon = isCongested ? '🛑 ROUTE DELAY' : '🟢 ON ROUTE';
            console.log(`[${new Date().toLocaleTimeString()}] ${statusIcon} | Waypoint: ${currentWaypoint} -> ${nextWaypoint} | Speed: ${targetSpeed.toFixed(1)} km/h | Heading: ${heading.toFixed(0)}°`);
        } catch (error) {
            console.error('Update failed. Is the server.py running?', error.message);
        }
    }, 3000);

    process.on('SIGINT', () => {
        clearInterval(interval);
        console.log('\nSimulation stopped.');
        process.exit();
    });
}

simulate();
