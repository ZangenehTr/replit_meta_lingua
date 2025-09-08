"""
Accent policy and content generation rules for different exam types and levels.
"""
import random
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass

@dataclass
class AccentConfig:
    """Configuration for accent selection per exam type."""
    listening_accents: List[str]
    vocabulary_accents: List[str]

class AccentPolicy:
    """Manages accent selection based on exam type and content type."""
    
    POLICIES = {
        'general': AccentConfig(['US', 'US_FEMALE'], ['US', 'US_FEMALE']),
        'toefl': AccentConfig(['US', 'US_FEMALE'], ['US', 'US_FEMALE']),
        'ielts': AccentConfig(['UK', 'UK_FEMALE', 'US', 'AU'], ['UK', 'UK_FEMALE']),
        'pte': AccentConfig(['UK', 'AU', 'US', 'CA', 'IN'], ['UK', 'UK_FEMALE']),
        'business': AccentConfig(['US', 'UK', 'IN', 'AR_L2', 'ZH_L2', 'US_FEMALE', 'UK_FEMALE'], ['US', 'US_FEMALE'])
    }
    
    @classmethod
    def get_accent_config(cls, goal: str) -> AccentConfig:
        """Get accent configuration for a given exam type."""
        return cls.POLICIES.get(goal.lower(), cls.POLICIES['general'])
    
    @classmethod
    def select_accents_for_listening(cls, goal: str, num_speakers: int = 2, seed: int = None) -> List[str]:
        """Select accents for listening practice based on exam type."""
        if seed is not None:
            random.seed(seed)
            
        config = cls.get_accent_config(goal)
        accents = config.listening_accents
        
        # For IELTS, prefer UK but allow some variety
        if goal.lower() == 'ielts':
            if num_speakers == 2:
                # 70% chance of UK-only, 30% chance of mix
                if random.random() < 0.7:
                    return random.choices(['UK', 'UK_FEMALE'], k=num_speakers)
                else:
                    uk_accents = ['UK', 'UK_FEMALE']
                    other_accents = ['US', 'AU']
                    return [random.choice(uk_accents), random.choice(other_accents)]
        
        # For other exams, select from available accents
        return random.choices(accents, k=num_speakers)
    
    @classmethod 
    def select_accent_for_vocabulary(cls, goal: str, seed: int = None) -> str:
        """Select accent for vocabulary pronunciation."""
        if seed is not None:
            random.seed(seed + 1)  # Different seed for vocab
            
        config = cls.get_accent_config(goal)
        return random.choice(config.vocabulary_accents)

class ContentGenerator:
    """Generates natural conversation content based on level and topic."""
    
    CONVERSATION_STARTERS = {
        'general': [
            "Hi there! How can I help you today?",
            "Good morning! What can I do for you?", 
            "Hello! How are you doing today?"
        ],
        'business': [
            "Good morning, thank you for joining our meeting.",
            "Welcome everyone. Let's begin today's discussion.",
            "Thank you all for being here. Shall we start?"
        ],
        'academic': [
            "Today we'll be discussing an important topic.",
            "Let's examine this subject in more detail.",
            "This is a fascinating area of study."
        ]
    }
    
    NATURAL_RESPONSES = [
        "That's a great question.",
        "I see what you mean.",
        "That makes perfect sense.",
        "Absolutely, I agree.",
        "That's exactly right.",
        "Good point.",
        "I hadn't thought of that.",
        "That's interesting."
    ]
    
    HESITATIONS = ["um", "uh", "well", "you know", "I mean", "sort of", "kind of"]
    BACKCHANNELS = ["mm-hmm", "right", "yeah", "okay", "I see", "uh-huh"]
    
    @classmethod
    def generate_conversation_script(cls, topic: str, level: str, goal: str, duration_sec: int, 
                                   num_speakers: int = 2, seed: int = None) -> List[Dict[str, Any]]:
        """Generate a natural conversation script."""
        if seed is not None:
            random.seed(seed)
        
        script = []
        
        # Determine conversation type based on topic and goal
        if goal == 'ielts' and any(word in topic.lower() for word in ['booking', 'reservation', 'appointment']):
            script = cls._generate_ielts_booking_conversation(topic, level, duration_sec)
        elif goal == 'toefl' and 'campus' in topic.lower():
            script = cls._generate_campus_conversation(topic, level, duration_sec)
        elif goal == 'business':
            script = cls._generate_business_conversation(topic, level, duration_sec)
        else:
            script = cls._generate_general_conversation(topic, level, duration_sec, num_speakers)
        
        return script
    
    @classmethod
    def _generate_ielts_booking_conversation(cls, topic: str, level: str, duration_sec: int) -> List[Dict[str, Any]]:
        """Generate IELTS Section 1 style booking conversation."""
        is_advanced = level in ['B2', 'C1', 'C2']
        
        # Extract service type from topic
        service_type = 'fitness class'
        if 'swimming' in topic.lower():
            service_type = 'swimming lesson'
        elif 'yoga' in topic.lower():
            service_type = 'yoga class'
        elif 'hotel' in topic.lower():
            service_type = 'hotel room'
        elif 'restaurant' in topic.lower():
            service_type = 'dinner reservation'
        
        script = [
            {
                "speaker": 0,  # Female receptionist
                "text": f"Good morning, City Centre Sports Club, this is Emma speaking. How can I help you?",
                "emotion": "professional",
                "pace": 1.0
            },
            {
                "speaker": 1,  # Male customer  
                "text": f"Hello Emma, I'm calling about your {service_type}s. I saw your advertisement online.",
                "emotion": "polite",
                "pace": 0.95
            },
            {
                "speaker": 0,
                "text": "Certainly! Are you looking for beginner classes or do you have some experience?",
                "emotion": "helpful",
                "pace": 1.0
            },
            {
                "speaker": 1,
                "text": "I'm a complete beginner actually. I'm twenty-nine years old and I'd like to try something new.",
                "emotion": "friendly",
                "pace": 0.9
            }
        ]
        
        # Add more turns based on duration target
        target_turns = max(12, duration_sec // 8)  # Rough estimate
        
        booking_details = [
            ("schedule", "We have classes on Tuesday evenings and Saturday mornings. Which would work better for you?"),
            ("preference", "Saturday mornings would be perfect. I work during the week."),
            ("timing", "The Saturday class runs from ten o'clock until eleven thirty."),
            ("cost_inquiry", "That sounds great. How much does it cost?"),
            ("pricing", "It's fifteen pounds per session, or you can buy a course of six sessions for seventy-five pounds."),
            ("booking", "I'd like the six-session course please. When can I start?"),
            ("start_date", "The next course begins this Saturday, October twenty-first. Shall I book you in?"),
            ("confirmation", "Yes please. What details do you need?"),
            ("name_request", "I'll need your full name first."),
            ("name_response", "It's David Thompson. That's D-A-V-I-D Thompson, T-H-O-M-P-S-O-N."),
            ("address_request", "Thank you David. And your address please?"),
            ("address_response", "It's twenty-eight Park Road, that's P-A-R-K Road, in Millfield, postcode M-F-seven, four-A-B."),
            ("phone_request", "And can I have your telephone number?"),
            ("phone_response", "Yes, it's oh-seven-nine-six-two-four-eight-three-five-seven."),
            ("email_request", "Perfect. Do you have an email address?"),
            ("email_response", "It's david-thompson-at-gmail-dot-com."),
            ("final_questions", "Excellent. Is there anything else you'd like to know?"),
            ("equipment_inquiry", "Should I bring any equipment?"),
            ("equipment_response", "No, we provide everything. Just wear comfortable sports clothes."),
            ("parking_inquiry", "What about parking?"),
            ("parking_response", "We have free parking for students. Just show your booking confirmation."),
            ("final_confirmation", "Perfect. So I'm confirmed for Saturday October twenty-first at ten AM?"),
            ("confirmation_response", "That's correct David. Please arrive fifteen minutes early. See you Saturday!"),
            ("thanks", "Thank you so much Emma."),
            ("goodbye", "You're very welcome David. Have a lovely day!")
        ]
        
        current_speaker = 0
        for i, (turn_type, text) in enumerate(booking_details):
            if len(script) >= target_turns:
                break
                
            speaker = current_speaker % 2
            script.append({
                "speaker": speaker,
                "text": text,
                "emotion": "conversational",
                "pace": 0.95 if is_advanced else 0.85
            })
            current_speaker += 1
        
        return script
    
    @classmethod
    def _generate_campus_conversation(cls, topic: str, level: str, duration_sec: int) -> List[Dict[str, Any]]:
        """Generate TOEFL-style campus conversation."""
        script = [
            {
                "speaker": 0,  # Student advisor
                "text": "Hi there! I'm Sarah from the Student Services office. How can I help you today?",
                "emotion": "friendly",
                "pace": 1.0
            },
            {
                "speaker": 1,  # Student
                "text": "Hi Sarah. I'm having some trouble with my course registration for next semester.",
                "emotion": "concerned",
                "pace": 0.9
            }
        ]
        
        # Add campus-specific dialogue
        campus_topics = [
            "I see. What specific courses are you trying to register for?",
            "Well, I need to take Biology 201 and Chemistry 150, but they're showing as closed.",
            "Let me check the system. Sometimes we can add students to a waitlist.",
            "That would be great. I really need these courses for my pre-med requirements.",
            "I understand completely. These are popular courses. Let me see what options we have."
        ]
        
        for i, text in enumerate(campus_topics):
            script.append({
                "speaker": i % 2,
                "text": text,
                "emotion": "helpful" if i % 2 == 0 else "hopeful",
                "pace": 1.0 if level in ['B2', 'C1', 'C2'] else 0.9
            })
        
        return script
    
    @classmethod
    def _generate_business_conversation(cls, topic: str, level: str, duration_sec: int) -> List[Dict[str, Any]]:
        """Generate business meeting conversation."""
        script = [
            {
                "speaker": 0,  # Meeting leader
                "text": "Good morning everyone. Thank you for joining today's quarterly review meeting.",
                "emotion": "professional",
                "pace": 1.0
            },
            {
                "speaker": 1,  # Team member
                "text": "Good morning. Thanks for organizing this, Jennifer.",
                "emotion": "professional", 
                "pace": 1.0
            }
        ]
        
        business_content = [
            "Let's start by reviewing our Q3 performance against our targets.",
            "The sales figures look quite positive. We exceeded our goal by twelve percent.",
            "That's excellent news. What were the main drivers behind this success?",
            "I think our new marketing campaign really resonated with customers.",
            "The digital strategy we implemented in August has been particularly effective."
        ]
        
        for i, text in enumerate(business_content):
            script.append({
                "speaker": i % 2,
                "text": text,
                "emotion": "professional",
                "pace": 1.05 if level in ['C1', 'C2'] else 1.0
            })
        
        return script
    
    @classmethod  
    def _generate_general_conversation(cls, topic: str, level: str, duration_sec: int, num_speakers: int) -> List[Dict[str, Any]]:
        """Generate general conversation based on topic."""
        script = []
        
        # Simple conversation starter
        starters = cls.CONVERSATION_STARTERS.get('general', cls.CONVERSATION_STARTERS['general'])
        script.append({
            "speaker": 0,
            "text": random.choice(starters),
            "emotion": "friendly",
            "pace": 1.0 if level in ['B2', 'C1', 'C2'] else 0.9
        })
        
        # Add topic-specific content
        if 'food' in topic.lower():
            script.extend(cls._generate_food_conversation(level))
        elif 'travel' in topic.lower():
            script.extend(cls._generate_travel_conversation(level))
        else:
            script.extend(cls._generate_generic_conversation(topic, level))
        
        return script
    
    @classmethod
    def _generate_food_conversation(cls, level: str) -> List[Dict[str, Any]]:
        """Generate food-related conversation."""
        return [
            {
                "speaker": 1,
                "text": "I'm looking for a good restaurant recommendation for tonight.",
                "emotion": "curious",
                "pace": 0.9
            },
            {
                "speaker": 0, 
                "text": "What kind of cuisine are you in the mood for?",
                "emotion": "helpful",
                "pace": 1.0
            },
            {
                "speaker": 1,
                "text": "Something Italian would be perfect. Maybe with outdoor seating?",
                "emotion": "hopeful", 
                "pace": 0.95
            }
        ]
    
    @classmethod
    def _generate_travel_conversation(cls, level: str) -> List[Dict[str, Any]]:
        """Generate travel-related conversation.""" 
        return [
            {
                "speaker": 1,
                "text": "I'm planning a trip to Europe next month. Any suggestions?",
                "emotion": "excited",
                "pace": 0.95
            },
            {
                "speaker": 0,
                "text": "How exciting! What countries are you thinking of visiting?",
                "emotion": "enthusiastic",
                "pace": 1.0
            }
        ]
    
    @classmethod
    def _generate_generic_conversation(cls, topic: str, level: str) -> List[Dict[str, Any]]:
        """Generate generic conversation about any topic."""
        return [
            {
                "speaker": 1,
                "text": f"I've been thinking about {topic} lately.",
                "emotion": "thoughtful",
                "pace": 0.9
            },
            {
                "speaker": 0,
                "text": random.choice(cls.NATURAL_RESPONSES),
                "emotion": "interested", 
                "pace": 1.0
            }
        ]