// Statistical data from analysis - means and standard deviations in milliseconds
const stats = {
    means: [485.28, 2198.38, 2145.91], // ms: Start→London, London→Tokyo, Tokyo→End
    stdDevs: [245.48, 120.45, 129.14] // ms: Standard deviations for each segment
};

// Simulated data based on statistical analysis
// Using normal distribution approximation for simplicity
function generateRandomTime(mean, stdDev) {
    // Box-Muller transformation for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(100, mean + z * stdDev); // Ensure positive values
}

function calculatePercentile(value, sortedArray) {
    if (sortedArray.length === 0) return 0;

    let count = 0;
    for (let i = 0; i < sortedArray.length; i++) {
        if (sortedArray[i] <= value) count++;
    }
    return (count / sortedArray.length) * 100;
}

function getStarRating(percentile) {
    if (percentile >= 90) {
        return {
            stars: "⭐⭐⭐⭐⭐",
            label: "Lightning Fast",
            description: "(top 10%)"
        };
    } else if (percentile >= 75) {
        return {
            stars: "⭐⭐⭐⭐",
            label: "Fast",
            description: "(top 25%)"
        };
    } else if (percentile >= 25) {
        return {
            stars: "⭐⭐⭐",
            label: "Average",
            description: "(average)"
        };
    } else if (percentile >= 10) {
        return {
            stars: "⭐⭐",
            label: "Slow",
            description: "(below average)"
        };
    } else {
        return {
            stars: "⭐",
            label: "Very Slow",
            description: "(bottom 25%)"
        };
    }
}

// Historical data for percentile calculation (based on analysis)
const historicalTotalTimes = Array.from({length: 280}, () => {
    const segments = [
        generateRandomTime(485.28, 245.48),
        generateRandomTime(2198.38, 120.45),
        generateRandomTime(2145.91, 129.14)
    ];
    return segments.reduce((sum, time) => sum + time, 0);
}).sort((a, b) => a - b);

// Historical segment data for percentile calculation
const historicalSegmentTimes = [
    Array.from({length: 280}, () => generateRandomTime(485.28, 245.48)).sort((a, b) => a - b),
    Array.from({length: 280}, () => generateRandomTime(2198.38, 120.45)).sort((a, b) => a - b),
    Array.from({length: 280}, () => generateRandomTime(2145.91, 129.14)).sort((a, b) => a - b)
];

class JourneySimulator {
    constructor() {
        this.currentRegion = 0;
        this.startTime = 0;
        this.segmentStartTime = 0;
        this.segmentTimes = [];
        this.segmentPercentiles = [];
        this.totalTime = 0;
        this.isRunning = false;

        this.regions = ['region0', 'region1', 'region2', 'region3'];
        this.progressBars = ['progress0', 'progress1', 'progress2'];

        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('startRun').addEventListener('click', () => this.startJourney());
    }


    async startJourney() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.reset();

        document.getElementById('startRun').disabled = true;
        document.getElementById('simulationArea').style.display = 'block';
        document.getElementById('results').style.display = 'none';
        document.querySelector('.timing-display').style.display = 'block';

        this.startTime = Date.now();
        this.segmentStartTime = this.startTime;

        // Activate first region
        document.getElementById(this.regions[0]).classList.add('active');

        // Update timer
        this.updateTimer();

        // Simulate journey through regions
        for (let i = 0; i < 3; i++) {
            await this.travelToNextRegion(i);
        }

        this.completeJourney();
    }

    async travelToNextRegion(segmentIndex) {
        // Generate random time for this segment
        const segmentTime = generateRandomTime(stats.means[segmentIndex], stats.stdDevs[segmentIndex]);

        // Animate progress bar
        await this.animateProgress(segmentIndex, segmentTime);

        // Update region states
        document.getElementById(this.regions[segmentIndex]).classList.remove('active');
        document.getElementById(this.regions[segmentIndex]).classList.add('completed');
        document.getElementById(this.regions[segmentIndex + 1]).classList.add('active');

        // Record segment time and percentile
        this.segmentTimes.push(segmentTime);
        const segmentPercentile = calculatePercentile(segmentTime, historicalSegmentTimes[segmentIndex]);
        this.segmentPercentiles.push(segmentPercentile);

        this.segmentStartTime += segmentTime;
    }

    async animateProgress(segmentIndex, duration) {
        const progressBar = document.getElementById(this.progressBars[segmentIndex]);
        const startTime = Date.now();

        return new Promise(resolve => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1) * 100;

                progressBar.style.width = progress + '%';

                if (progress < 100) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }

    updateTimer() {
        if (!this.isRunning) return;

        const elapsed = Date.now() - this.startTime;
        document.getElementById('currentTime').textContent = (elapsed / 1000).toFixed(3) + 's';

        if (this.isRunning) {
            requestAnimationFrame(() => this.updateTimer());
        }
    }

    completeJourney() {
        this.isRunning = false;
        // Use actual elapsed time instead of sum of generated times
        this.totalTime = Date.now() - this.startTime;
        const generatedTotalTime = this.segmentTimes.reduce((sum, time) => sum + time, 0);

        // Complete final region
        document.getElementById(this.regions[3]).classList.remove('active');
        document.getElementById(this.regions[3]).classList.add('completed');

        // Calculate total percentile using generated time for statistical comparison
        const totalPercentile = calculatePercentile(generatedTotalTime, historicalTotalTimes);

        // Hide timing display
        document.querySelector('.timing-display').style.display = 'none';

        // Show results (use stored segment percentiles)
        this.showResults(totalPercentile, this.segmentPercentiles);

        // Re-enable button
        document.getElementById('startRun').disabled = false;
    }

    showResults(totalPercentile, segmentPercentiles) {
        const resultsDiv = document.getElementById('results');
        const finalTimeDiv = document.getElementById('finalTime');
        const percentileDiv = document.getElementById('percentileResult');
        const explanationDiv = document.getElementById('explanation');

        // Get star rating for total performance
        const totalRating = getStarRating(totalPercentile);

        finalTimeDiv.textContent = (this.totalTime / 1000).toFixed(3) + 's';

        // Safely update main rating display
        percentileDiv.textContent = '';
        const starsSpan = document.createElement('span');
        starsSpan.textContent = totalRating.stars;
        const labelSpan = document.createElement('span');
        labelSpan.textContent = totalRating.label;
        labelSpan.style.fontSize = '1rem';
        labelSpan.style.display = 'block';
        percentileDiv.appendChild(starsSpan);
        percentileDiv.appendChild(labelSpan);

        explanationDiv.textContent = `${totalRating.description} - Great job completing your journey around the planet!`;

        // Update segment details with star ratings
        for (let i = 0; i < 3; i++) {
            const segmentRating = getStarRating(segmentPercentiles[i]);
            document.getElementById(`segmentTime${i}`).textContent = (this.segmentTimes[i] / 1000).toFixed(3) + 's';

            // Safely update segment rating display
            const segmentElement = document.getElementById(`segmentPercentile${i}`);
            segmentElement.textContent = '';
            const segmentStarsSpan = document.createElement('span');
            segmentStarsSpan.textContent = segmentRating.stars;
            const segmentLabelSpan = document.createElement('span');
            segmentLabelSpan.textContent = segmentRating.label;
            segmentLabelSpan.style.fontSize = '0.8rem';
            segmentLabelSpan.style.opacity = '0.8';
            segmentLabelSpan.style.display = 'block';
            segmentElement.appendChild(segmentStarsSpan);
            segmentElement.appendChild(segmentLabelSpan);
        }

        resultsDiv.style.display = 'block';
    }

    reset() {
        this.currentRegion = 0;
        this.segmentTimes = [];
        this.segmentPercentiles = [];
        this.totalTime = 0;

        // Reset all visual states
        this.regions.forEach(regionId => {
            const element = document.getElementById(regionId);
            element.classList.remove('active', 'completed');
        });

        this.progressBars.forEach(progressId => {
            document.getElementById(progressId).style.width = '0%';
        });

        document.getElementById('currentTime').textContent = '0.000s';
    }
}

// Initialize the simulator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new JourneySimulator();
});