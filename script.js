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


// Unified rating system - eliminates duplication
const RATING_LEVELS = [
    { stars: "⭐⭐⭐⭐⭐", label: "Lightning Fast" },
    { stars: "⭐⭐⭐⭐", label: "Fast" },
    { stars: "⭐⭐⭐", label: "Average" },
    { stars: "⭐⭐", label: "Slow" },
    { stars: "⭐", label: "Very Slow" }
];

// Thresholds for total journey and each segment
const THRESHOLDS = {
    total: [4.453, 4.624, 4.992, 5.203],
    segments: [
        [0.166, 0.308, 0.674, 0.826], // Segment 1: Start → London
        [2.038, 2.128, 2.285, 2.358], // Segment 2: London → Tokyo
        [1.978, 2.043, 2.253, 2.317]  // Segment 3: Tokyo → End
    ]
};

function getRating(timeInMs, thresholds) {
    const timeInSeconds = timeInMs / 1000;

    for (let i = 0; i < thresholds.length; i++) {
        if (timeInSeconds <= thresholds[i]) {
            return RATING_LEVELS[i];
        }
    }
    return RATING_LEVELS[4]; // Very Slow
}

function getTotalJourneyRating(timeInMs) {
    return getRating(timeInMs, THRESHOLDS.total);
}

function getSegmentRating(timeInMs, segmentIndex) {
    return getRating(timeInMs, THRESHOLDS.segments[segmentIndex]);
}


class JourneySimulator {
    constructor() {
        this.segmentTimes = []; // Will store animation durations for each segment
        this.totalTime = 0;
        this.isRunning = false;
        this.currentSegmentIndex = 0;
        this.currentSegmentStartTime = 0;
        this.currentSegmentDuration = 0;

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

        // Activate first region
        document.getElementById(this.regions[0]).classList.add('active');

        // Update timer based on animation progress
        this.updateTimer();

        // Simulate journey through regions
        for (let i = 0; i < 3; i++) {
            await this.travelToNextRegion(i);
        }

        this.completeJourney();
    }

    async travelToNextRegion(segmentIndex) {
        // Generate animation time for this segment
        const animationTime = generateRandomTime(stats.means[segmentIndex], stats.stdDevs[segmentIndex]);

        // Set up current segment tracking for smooth animations
        this.currentSegmentIndex = segmentIndex;
        this.currentSegmentStartTime = Date.now();
        this.currentSegmentDuration = animationTime;

        // Animate progress bar
        await this.animateProgress(segmentIndex, animationTime);

        // Update region states
        document.getElementById(this.regions[segmentIndex]).classList.remove('active');
        document.getElementById(this.regions[segmentIndex]).classList.add('completed');
        document.getElementById(this.regions[segmentIndex + 1]).classList.add('active');

        // Record animation time as the segment time (unified timing)
        this.segmentTimes.push(animationTime);
    }

    async animateProgress(segmentIndex, duration) {
        // Wait for the specified duration while updateTimer handles the visual animation
        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }

    updateTimer() {
        if (!this.isRunning) return;

        // Calculate completed segments time
        const completedTime = this.segmentTimes.reduce((sum, time) => sum + time, 0);

        // Calculate current segment progress - eliminate duplicate calculation
        let currentSegmentProgress = 0;
        let currentSegmentElapsed = 0;
        if (this.currentSegmentDuration > 0) {
            currentSegmentElapsed = Date.now() - this.currentSegmentStartTime;
            currentSegmentProgress = Math.min(currentSegmentElapsed, this.currentSegmentDuration);
        }

        // Total current time = completed segments + current segment progress
        const totalCurrentTime = completedTime + currentSegmentProgress;
        document.getElementById('currentTime').textContent = (totalCurrentTime / 1000).toFixed(3) + 's';

        // Update progress bar for current segment - reuse calculated elapsed time
        if (this.currentSegmentIndex < this.progressBars.length && this.currentSegmentDuration > 0) {
            const progress = Math.min(currentSegmentElapsed / this.currentSegmentDuration, 1) * 100;
            document.getElementById(this.progressBars[this.currentSegmentIndex]).style.width = progress + '%';
        }

        if (this.isRunning) {
            requestAnimationFrame(() => this.updateTimer());
        }
    }

    completeJourney() {
        this.isRunning = false;
        // Calculate total time from sum of animation durations (unified timing)
        this.totalTime = this.segmentTimes.reduce((sum, time) => sum + time, 0);

        // Complete final region
        document.getElementById(this.regions[3]).classList.remove('active');
        document.getElementById(this.regions[3]).classList.add('completed');

        // Hide timing display
        document.querySelector('.timing-display').style.display = 'none';

        // Show results using unified animation timing
        this.showResults();

        // Re-enable button
        document.getElementById('startRun').disabled = false;
    }

    // Helper function to eliminate duplicated rating display creation
    createRatingDisplay(element, rating, styles = {}) {
        element.textContent = '';
        const starsSpan = document.createElement('span');
        starsSpan.textContent = rating.stars;
        const labelSpan = document.createElement('span');
        labelSpan.textContent = rating.label;
        labelSpan.style.fontSize = styles.fontSize || '1rem';
        labelSpan.style.opacity = styles.opacity || '1';
        labelSpan.style.display = 'block';
        element.appendChild(starsSpan);
        element.appendChild(labelSpan);
    }

    showResults() {
        const resultsDiv = document.getElementById('results');
        const finalTimeDiv = document.getElementById('finalTime');
        const percentileDiv = document.getElementById('percentileResult');

        // Defensive programming: Check if elements exist
        if (!resultsDiv || !finalTimeDiv || !percentileDiv) {
            console.error('Required DOM elements not found for showResults');
            return;
        }

        // Use animation time for both display and rating calculation (unified timing)
        const totalRating = getTotalJourneyRating(this.totalTime);

        finalTimeDiv.textContent = (this.totalTime / 1000).toFixed(3) + 's';

        // Create main rating display using helper
        this.createRatingDisplay(percentileDiv, totalRating);

        // Update segment details with star ratings using new time-based system
        for (let i = 0; i < 3; i++) {
            const segmentTimeElement = document.getElementById(`segmentTime${i}`);
            const segmentElement = document.getElementById(`segmentPercentile${i}`);

            // Check if segment elements exist
            if (!segmentTimeElement || !segmentElement) {
                console.error(`Segment ${i} elements not found`);
                continue;
            }

            const segmentRating = getSegmentRating(this.segmentTimes[i], i);
            segmentTimeElement.textContent = (this.segmentTimes[i] / 1000).toFixed(3) + 's';

            // Create segment rating display using helper
            this.createRatingDisplay(segmentElement, segmentRating, { fontSize: '0.8rem', opacity: '0.8' });
        }

        resultsDiv.style.display = 'block';
    }

    reset() {
        this.segmentTimes = [];
        this.totalTime = 0;
        this.currentSegmentIndex = 0;
        this.currentSegmentStartTime = 0;
        this.currentSegmentDuration = 0;

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