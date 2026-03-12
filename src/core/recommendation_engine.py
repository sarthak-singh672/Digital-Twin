import numpy as np
from datetime import datetime


class RecommendationEngine:
    def __init__(self):
        # Weighted Thresholds for Multi-variate Analysis
        self.LIMITS = {
            "stress_high": 7.0,
            "sleep_low": 6.0,
            "study_low": 3.0,
            "hr_high": 90.0,
            "risk_high": 0.7,
            "hydration_low": 4.0
        }

    def generate_all_insights(self, features, anomalies, risk_score):
        insights = []

        # --- Immediate Variables ---
        stress = features.get('stress_score', 5.0)
        sleep = features.get('sleep_hrs', 7.0)
        study = features.get('study_hrs', 5.0)
        hr = features.get('hr', 75.0)
        water = features.get('water_glasses', 6.0)
        activity = features.get('activity_hrs', 0.5)

        # --- Trend Variables (7-day means) ---
        sleep_mean_7d = features.get('sleep_hrs_mean_7d', sleep)
        stress_mean_7d = features.get('stress_score_mean_7d', stress)
        study_mean_7d = features.get('study_hrs_mean_7d', study)
        hr_mean_7d = features.get('hr_mean_7d', hr)
        activity_mean_7d = features.get('activity_hrs_mean_7d', activity)

        hr_anomaly = any(a.get('metric') == 'heart_rate' for a in anomalies)
        is_weekend = datetime.now().weekday() >= 5

        # 1. SLEEP DEBT ACCUMULATION
        if sleep_mean_7d < 6.5 and stress_mean_7d > 6.0 and study_mean_7d > 5.0:
            insights.append({
                "title": "Accumulated Sleep Debt",
                "severity": "warning",
                "explanation": "Your 7-day rolling averages indicate a progressive accumulation of sleep debt while maintaining a demanding cognitive workload. Operating at a prolonged sleep deficit impairs memory consolidation and increases baseline cortisol. Continuing at this pace without adequate recovery risks acute burnout.",
                "causes": [
                    "Average sleep duration consistently below the 7-hour recovery threshold.",
                    "Sustained high academic workload demanding maximum cognitive output.",
                    "Elevated baseline stress preventing entry into deep, restorative sleep architectures."
                ],
                "actions": [
                    "Implement a strict sleep debt correction plan starting tonight.",
                    "Prioritize active down-regulation 60 minutes before bed."
                ],
                "health_goals": [
                    "Go to bed 45 minutes earlier than your usual time tonight.",
                    "Avoid screens and study materials entirely for 60 minutes before sleep."
                ]
            })

        # 2. SUSTAINED SYMPATHETIC ACTIVATION
        if stress_mean_7d > 7.0 and hr_mean_7d > 85.0 and hr > 90.0:
            insights.append({
                "title": "Sustained Stress Response",
                "severity": "danger",
                "explanation": "Your physiological data shows signs of sustained sympathetic nervous system activation, commonly known as being stuck in 'fight or flight' mode. This state prevents the parasympathetic 'rest and digest' response, severely limiting physical and mental recovery.",
                "causes": [
                    "Prolonged exposure to high stress without sufficient periods of down-regulation.",
                    "Elevated resting heart rate indicating physiological and cardiovascular strain.",
                    "Inadequate parasympathetic recovery activities."
                ],
                "actions": [
                    "Execute a 15-minute parasympathetic reset immediately.",
                    "Shift from passive rest (scrolling) to active recovery (breathwork, walking)."
                ],
                "health_goals": [
                    "Complete a 10-minute deep breathing or mindfulness meditation session today.",
                    "Keep daily caffeine intake to zero after 2:00 PM to allow heart rate settling."
                ]
            })

        # 3. MENTAL RECOVERY DEFICIT
        if study > 8.0 and sleep < 7.0 and activity_mean_7d < 0.5:
            insights.append({
                "title": "Mental Fatigue & Low Activity",
                "severity": "warning",
                "explanation": "You are experiencing a mental recovery deficit due to heavily skewed daily activity. High consecutive hours of cognitive exertion without sufficient physical movement creates a bottleneck in mental processing. The brain requires 'offline' time and blood circulation to clear metabolic waste.",
                "causes": [
                    "Disproportionate ratio of heavy cognitive load to physical activity.",
                    "Insufficient sleep duration to clear acute cognitive fatigue.",
                    "Sedentary behavior compounding physical tension."
                ],
                "actions": [
                    "Implement a cognitive unloading strategy immediately.",
                    "Introduce 'movement snacks' between heavy study sessions."
                ],
                "health_goals": [
                    "Limit focused study blocks to 45 minutes, followed by a mandatory 10-minute break.",
                    "Take a 20-minute brisk walk outdoors today without listening to educational content."
                ]
            })

        # 4. HYDRATION-COGNITION IMPAIRMENT
        if water < 4 and study > 5.0 and stress > 6.0:
            insights.append({
                "title": "Hydration-Related Fatigue",
                "severity": "info",
                "explanation": "Your fluid intake is insufficient to support your high level of mental exertion. The human brain is highly sensitive to mild dehydration, which directly manifests as brain fog, increased perceived stress, and reduced executive function.",
                "causes": [
                    "Water intake dropping below essential cognitive performance thresholds.",
                    "High academic demand accelerating metabolic rate and mental fatigue.",
                    "Increased stress response exacerbated by mild physiological dehydration."
                ],
                "actions": [
                    "Begin structured hydration recovery immediately.",
                    "Pair water intake with specific study milestones."
                ],
                "health_goals": [
                    "Drink two large glasses of water within the next hour.",
                    "Keep a water bottle visible on your desk and finish it by the end of your next study block."
                ]
            })

        # 5. CIRCADIAN RHYTHM INSTABILITY
        if abs(sleep - sleep_mean_7d) > 2.5 and stress > 6.0:
            insights.append({
                "title": "Sleep Cycle Disruption",
                "severity": "warning",
                "explanation": "There is a significant deviation in your recent sleep duration compared to your weekly baseline, indicating circadian rhythm instability. Wild fluctuations in sleep timing confuse the body's internal clock, disrupting cortisol regulation and degrading daytime alertness.",
                "causes": [
                    "High variance in day-to-day sleep duration.",
                    "Elevated stress levels disrupting natural sleep onset.",
                    "Inconsistent sleep-wake cycles confusing the circadian pacemaker."
                ],
                "actions": [
                    "Anchor your wake-up time to establish rhythm consistency.",
                    "Use morning sunlight exposure to reset your biological clock."
                ],
                "health_goals": [
                    "Set an alarm for the exact same wake-up time tomorrow, regardless of when you sleep tonight.",
                    "Get 10 minutes of direct sunlight exposure within 30 minutes of waking up."
                ]
            })

        # 6. HIGH CARDIOVASCULAR RISK
        if risk_score > self.LIMITS["risk_high"] and (hr > 100 or hr_anomaly):
            insights.append({
                "title": "High Physical Strain Detected",
                "severity": "danger",
                "explanation": "The AI risk model has detected a highly anomalous correlation between your current acute stress and cardiovascular strain. Operating in this zone places undue burden on your circulatory system and heavily impacts physical safety.",
                "causes": [
                    "Machine learning detection of high academic risk correlations.",
                    "Resting heart rate spiking above normal baseline.",
                    "Physical exhaustion overlapping with peak psychological stress."
                ],
                "actions": [
                    "Cease high-intensity academic or physical activities immediately.",
                    "Seek a professional medical evaluation if symptoms persist."
                ],
                "health_goals": [
                    "Lie down for a 20-minute guided Yoga Nidra or deep rest protocol right now.",
                    "Monitor your heart rate again in 2 hours to ensure it returns below 80 BPM."
                ]
            })

        # 7. ACUTE SLEEP DEPRIVATION
        if sleep < 5.0 and stress > 5.0 and study > 2.0:
            insights.append({
                "title": "Critical Sleep Deficit",
                "severity": "danger",
                "explanation": "You have crossed a critical threshold of sleep deprivation while still attempting to maintain academic output. Sleep below 5 hours halts the brain's ability to transfer short-term memories to long-term storage, rendering further studying largely ineffective.",
                "causes": [
                    "Logging less than 5 hours of total sleep.",
                    "Attempting to force cognitive output during a state of sleep-deprivation.",
                    "Elevated stress preventing nervous system down-regulation."
                ],
                "actions": [
                    "Halt complex cognitive tasks and pivot to passive learning.",
                    "Prioritize immediate sleep recovery over all non-essential tasks."
                ],
                "health_goals": [
                    "Stop studying at least 1 hour earlier than planned tonight.",
                    "Schedule a 30-minute non-REM nap this afternoon to temporarily clear adenosine buildup."
                ]
            })

        # 8. ACADEMIC BURNOUT
        if study > 6.0 and stress > 7.0 and sleep < 6.0:
            insights.append({
                "title": "Academic Burnout Risk",
                "severity": "warning",
                "explanation": "You are currently exhibiting the 'Burnout Triad': high workload, high psychological stress, and low physiological recovery. This combination depletes dopamine and serotonin, severely impacting your motivation and emotional resilience.",
                "causes": [
                    "High subjective stress levels combined with heavy study loads.",
                    "Failing to offset high output with required sleep hours.",
                    "Erosion of psychological boundaries between work and rest."
                ],
                "actions": [
                    "Enforce a strict boundary between study environments and rest environments.",
                    "Engage in an activity that provides a sense of detachment from academics."
                ],
                "health_goals": [
                    "Do not look at any academic material for the next 2 hours.",
                    "Ensure a minimum of 7.5 hours of sleep tonight to begin chemical baseline recovery."
                ]
            })

        # 9. HIGH STRESS MALADAPTATION
        if stress > 8.0 and hr > 90 and activity < 1.0:
            insights.append({
                "title": "Physical Tension Buildup",
                "severity": "warning",
                "explanation": "Your self-reported high stress is now physically manifesting as an elevated resting heart rate. Because your physical activity is low, the cortisol and adrenaline being generated by stress have no physical outlet, leading to maladaptation and physical tension.",
                "causes": [
                    "Sustained psychological pressure with no physical release.",
                    "Adrenaline accumulation causing an elevated resting heart rate.",
                    "Sedentary coping mechanisms exacerbating tension."
                ],
                "actions": [
                    "Utilize sensory grounding techniques (e.g., 5-4-3-2-1 method).",
                    "Introduce light physical exertion to process lingering cortisol."
                ],
                "health_goals": [
                    "Complete a 15-minute stretching or light yoga routine today.",
                    "Spend 10 minutes journaling to externalize cognitive worries."
                ]
            })

        # 10. COGNITIVE OVERLOAD
        if study > 10.0 and stress > 8.0:
            insights.append({
                "title": "Information Overload",
                "severity": "warning",
                "explanation": "You have pushed past the point of diminishing returns. Studying for over 10 hours while experiencing severe stress exceeds human working memory capacity, leading to a high error rate and zero actual knowledge retention.",
                "causes": [
                    "Attempting marathon study sessions without structural breaks.",
                    "Information processing demands exceeding mental bandwidth.",
                    "Stress-induced narrowing of focus leading to rigid thinking."
                ],
                "actions": [
                    "Immediately switch from input (reading) to output (testing) or rest.",
                    "Offload all non-essential decisions to reduce decision fatigue."
                ],
                "health_goals": [
                    "Write down a prioritized list of just 3 tasks for tomorrow, then close your books.",
                    "Engage in 20 minutes of entirely brainless, low-stimulation rest."
                ]
            })

        # 11. ANTICIPATORY ANXIETY / WEEKEND STRESS
        if is_weekend and stress > 6.0 and study < 2.0:
            insights.append({
                "title": "Anticipatory Stress",
                "severity": "info",
                "explanation": "Despite it being the weekend and having a low study load, your stress remains elevated. This pattern indicates 'Anticipatory Anxiety'—worrying about the upcoming week rather than resting in the present moment. This prevents true psychological recovery.",
                "causes": [
                    "Inability to mentally detach from academic responsibilities during off-hours.",
                    "Lack of structure on weekends leading to unstructured rumination.",
                    "Blurring of work and leisure boundaries."
                ],
                "actions": [
                    "Implement a 'brain dump' strategy to capture worries on paper.",
                    "Create a structured transition ritual between the weekend and Monday."
                ],
                "health_goals": [
                    "Spend 15 minutes planning your Monday schedule, then strictly step away from work.",
                    "Do one purely joyful, non-productive hobby for 45 minutes today."
                ]
            })

        # 12. DIGITAL FATIGUE / SCREEN STRAIN
        if study > 7.0 and sleep < 6.0 and water < 5:
            insights.append({
                "title": "Digital Eye Strain & Fatigue",
                "severity": "info",
                "explanation": "The combination of long study hours, low sleep, and mild dehydration is placing heavy strain on your central nervous system, specifically manifesting as ocular (eye) fatigue and frontal lobe exhaustion from prolonged screen use.",
                "causes": [
                    "Extended periods of screen luminance disrupting melatonin production.",
                    "Lack of sleep preventing ocular muscle recovery.",
                    "Low hydration thickening the blood, reducing oxygen delivery to the brain."
                ],
                "actions": [
                    "Apply the 20-20-20 rule strictly for the remainder of the day.",
                    "Switch to analog study materials (paper, books) where possible."
                ],
                "health_goals": [
                    "Turn on night-mode/blue-light filters on all devices right now.",
                    "Drink 1 full glass of water every time you finish a screen-based task today."
                ]
            })

        # 13. ACADEMIC AVOIDANCE PARALYSIS
        if stress > 8.0 and study <= 1.0:
            insights.append({
                "title": "Task Overwhelm & Paralysis",
                "severity": "warning",
                "explanation": "You are experiencing a high-stress paralysis. The stress of the workload is so intense that the brain triggers an avoidance response, resulting in near-zero productivity. This creates a negative feedback loop where avoiding work increases tomorrow's stress.",
                "causes": [
                    "Task scope feels too overwhelming to initiate.",
                    "Perfectionism or fear of failure triggering procrastination.",
                    "Amygdala hijack prioritizing immediate emotional relief over long-term goals."
                ],
                "actions": [
                    "Lower the barrier to entry to an absurdly easy level.",
                    "Separate the act of 'starting' from the expectation of 'finishing'."
                ],
                "health_goals": [
                    "Commit to opening your textbook or laptop for exactly 5 minutes, with permission to quit after.",
                    "Write down the single smallest possible step required to start your most stressful project."
                ]
            })

        # 14. ACUTE PHYSICAL SEDENTARISM
        if study > 8.0 and activity == 0.0 and sleep > 7.0:
            insights.append({
                "title": "Prolonged Inactivity",
                "severity": "info",
                "explanation": "While your sleep is solid, you have spent an entire day completely sedentary due to high study volume. Prolonged sitting causes blood to pool in the lower extremities, reducing vascular flow to the brain and dropping your cognitive sharpness.",
                "causes": [
                    "Total lack of physical movement offsetting a high cognitive workload.",
                    "Extended sitting compressing the spine and restricting diaphragmatic breathing."
                ],
                "actions": [
                    "Interrupt prolonged sitting with rapid postural changes.",
                    "Engage the musculoskeletal system to pump blood back to the cerebral cortex."
                ],
                "health_goals": [
                    "Stand up, stretch your arms overhead, and do 10 squats right now.",
                    "Study standing up for at least 20 minutes of your next session."
                ]
            })

        # 15. OPTIMAL RESILIENCE STATE
        if not insights:
            insights.append({
                "title": "Optimal Health Balance",
                "severity": "success",
                "explanation": "Your physiological and behavioral metrics are operating in perfect synchronization. You are balancing cognitive load with adequate recovery, maintaining hydration, and managing stress effectively. This is the 'Flow State' baseline.",
                "causes": [
                    "Consistent sleep patterns matching daily cognitive demands.",
                    "Effective autonomic nervous system regulation (healthy heart rate and stress).",
                    "Balanced lifestyle choices supporting sustainable academic output."
                ],
                "actions": [
                    "Capitalize on this high-resilience state to tackle your hardest analytical tasks.",
                    "Document exactly what your routine was yesterday to replicate it in the future."
                ],
                "health_goals": [
                    "Maintain your current sleep and hydration routines exactly as they are.",
                    "Use your peak energy window today to complete your most challenging assignment."
                ]
            })

        # ---------------------------------------------------------
        # PRIORITY SORTING
        # ---------------------------------------------------------
        priority_map = {"danger": 1, "warning": 2, "info": 3, "success": 4}
        insights.sort(key=lambda x: priority_map.get(x["severity"], 99))

        return insights