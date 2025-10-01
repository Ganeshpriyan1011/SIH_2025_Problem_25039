import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Run in fallback mode without crashing the server
      logger.warn('GEMINI_API_KEY not set. Chatbot will use fallback responses.');
      // @ts-expect-error allow undefined when running in fallback mode
      this.genAI = undefined as any;
      this.model = null;
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateResponse(message: string, context?: string): Promise<string> {
    try {
      // Create a context-aware prompt for ocean hazard reporting
      let systemPrompt = `You are an AI assistant for the INCOIS (Indian National Centre for Ocean Information Services) Ocean Hazard Reporting Platform. 

Your role is to help users with:
- Ocean hazard information (tsunamis, cyclones, storm surges, high waves, etc.)
- Safety guidelines and emergency procedures
- Understanding ocean data and weather patterns
- Reporting procedures for hazards
- General questions about marine safety
- Analyzing current reports and trends in the system

Please provide accurate, helpful, and safety-focused responses. If you're unsure about specific technical details, recommend consulting official INCOIS resources or marine authorities.`;

      // Add simple context if provided
      if (context && context.trim()) {
        systemPrompt += `\n\n${context}`;
      }

      systemPrompt += `\n\nUser message: ${message}`;

      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();

      logger.info('Gemini AI response generated successfully');
      return text;
    } catch (error) {
      logger.error('Error generating Gemini AI response:', error);
      
      // Check if it's an API key error
      if (error instanceof Error && error.message && error.message.includes('API key not valid')) {
        logger.error('Gemini API key is invalid - using fallback response');
        return this.getFallbackResponse(message);
      }
      // For any other error, also return a safe fallback so chatbot never fails
      logger.warn('Using fallback chatbot response due to generation error');
      return this.getFallbackResponse(message);
    }
  }

  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Emergency responses
    if (lowerMessage.includes('tsunami') && lowerMessage.includes('warning')) {
      return `🚨 TSUNAMI WARNING RESPONSE:

1. **IMMEDIATE ACTION**: Move to higher ground immediately (at least 30 meters above sea level)
2. **EVACUATION**: Follow official evacuation routes and signs
3. **STAY INFORMED**: Listen to official emergency broadcasts
4. **DO NOT**: Return to coastal areas until authorities declare it safe
5. **EMERGENCY CONTACTS**: Call 108 for emergencies or contact local disaster management

⚠️ This is critical safety information. For real-time updates, contact INCOIS at +91-40-23886047 or visit www.incois.gov.in`;
    }
    
    if (lowerMessage.includes('cyclone')) {
      return `🌪️ CYCLONE SAFETY GUIDELINES:

**BEFORE THE CYCLONE:**
- Stock up on food, water, medicines, and batteries
- Secure loose objects around your property
- Stay updated with weather forecasts

**DURING THE CYCLONE:**
- Stay indoors and away from windows
- Avoid using electrical appliances
- Listen to battery-powered radio for updates

**AFTER THE CYCLONE:**
- Check for injuries and damages
- Avoid flooded areas and fallen power lines
- Wait for official all-clear before going outside

📞 Emergency: 108 | INCOIS: +91-40-23886047`;
    }
    
    if (lowerMessage.includes('report') && lowerMessage.includes('hazard')) {
      return `📝 HOW TO REPORT OCEAN HAZARDS:

1. **Online Portal**: Use this INCOIS platform to submit reports
2. **Include Details**: Location, time, type of hazard, description
3. **Add Photos**: If safe to do so, include visual evidence
4. **Contact Info**: Provide your contact details for follow-up

**EMERGENCY REPORTING:**
- Immediate danger: Call 108 (Emergency)
- Coast Guard: 1554
- INCOIS Helpline: +91-40-23886047

Your reports help protect coastal communities! 🌊`;
    }
    
    if (lowerMessage.includes('safety') || lowerMessage.includes('guidelines')) {
      return `🛡️ GENERAL OCEAN SAFETY GUIDELINES:

**COASTAL SAFETY:**
- Always check weather conditions before going to sea
- Inform someone about your plans and expected return
- Carry safety equipment (life jackets, communication devices)
- Know local emergency contact numbers

**WARNING SIGNS:**
- Unusual wave patterns or water recession
- Strong currents or rip tides
- Sudden weather changes
- Marine life behaving unusually

**EMERGENCY CONTACTS:**
- Emergency Services: 108
- Coast Guard: 1554
- INCOIS: +91-40-23886047

Stay safe and stay informed! 🌊`;
    }
    
    // Default response
    return `🤖 I'm here to help with ocean hazard information and safety guidelines.

**I can assist you with:**
- Emergency procedures (tsunamis, cyclones, storm surges)
- Safety guidelines for coastal areas
- How to report ocean hazards
- Marine weather information
- Emergency contact numbers

**Important Contacts:**
- Emergency: 108
- Coast Guard: 1554
- INCOIS: +91-40-23886047

Please ask me specific questions about ocean safety or hazards, and I'll provide detailed guidance.

⚠️ Note: AI services are temporarily limited. For urgent matters, please contact INCOIS directly.`;
  }

  async generateHazardAnalysis(hazardType: string, location: string, description: string): Promise<string> {
    try {
      const analysisPrompt = `As an ocean hazard expert, analyze the following hazard report:

Hazard Type: ${hazardType}
Location: ${location}
Description: ${description}

Please provide:
1. Risk assessment (Low/Medium/High)
2. Potential impacts
3. Safety recommendations
4. Immediate actions to take
5. Who should be notified

Keep the response concise but comprehensive, focusing on actionable information.`;

      const result = await this.model.generateContent(analysisPrompt);
      const response = await result.response;
      const text = response.text();

      logger.info('Gemini AI hazard analysis generated successfully');
      return text;
    } catch (error) {
      logger.error('Error generating hazard analysis:', error);
      
      // Fallback analysis
      return `🔍 HAZARD ANALYSIS - ${hazardType.toUpperCase()} at ${location}

**RISK ASSESSMENT:** Medium to High (Based on reported conditions)

**POTENTIAL IMPACTS:**
- Threat to life and property in coastal areas
- Disruption to marine activities and transportation
- Possible damage to coastal infrastructure
- Risk to marine ecosystems

**IMMEDIATE SAFETY RECOMMENDATIONS:**
1. **EVACUATE** if in immediate danger zone
2. **MONITOR** official weather/hazard updates
3. **AVOID** affected coastal areas
4. **SECURE** property and equipment
5. **PREPARE** emergency supplies

**IMMEDIATE ACTIONS:**
- Contact emergency services if lives are at risk (108)
- Report to Coast Guard (1554) for marine incidents
- Inform INCOIS (+91-40-23886047) for official reporting
- Alert local authorities and communities

**NOTIFICATIONS REQUIRED:**
- Local Disaster Management Authority
- Coast Guard Operations Center
- INCOIS Emergency Response Team
- Local Police and Fire Services

⚠️ This is a preliminary analysis. For detailed assessment, contact INCOIS experts immediately.`;
    }
  }

  async generateSafetyGuidelines(hazardType: string): Promise<string> {
    try {
      const guidelinesPrompt = `Provide comprehensive safety guidelines for ${hazardType} hazards. Include:

1. Pre-event preparation
2. During the event actions
3. Post-event safety measures
4. Emergency contacts and resources
5. Specific precautions for coastal communities

Format the response in clear, actionable points that are easy to understand and follow.`;

      const result = await this.model.generateContent(guidelinesPrompt);
      const response = await result.response;
      const text = response.text();

      logger.info('Gemini AI safety guidelines generated successfully');
      return text;
    } catch (error) {
      logger.error('Error generating safety guidelines:', error);
      
      // Fallback safety guidelines
      return `🛡️ SAFETY GUIDELINES - ${hazardType.toUpperCase()} HAZARDS

**PRE-EVENT PREPARATION:**
🔹 Monitor weather forecasts and official warnings
🔹 Prepare emergency kit (water, food, medicines, flashlight, radio)
🔹 Identify evacuation routes and safe locations
🔹 Secure property and remove loose objects
🔹 Charge all communication devices
🔹 Keep important documents in waterproof container

**DURING THE EVENT:**
🔹 Stay indoors and away from windows
🔹 Listen to battery-powered radio for updates
🔹 Avoid using electrical appliances
🔹 Do not venture outside unless absolutely necessary
🔹 If evacuation is ordered, leave immediately
🔹 Stay away from coastal areas and flood-prone zones

**POST-EVENT SAFETY:**
🔹 Wait for official all-clear before going outside
🔹 Check for injuries and provide first aid
🔹 Inspect property for damage before entering
🔹 Avoid flooded areas and fallen power lines
🔹 Use flashlights, not candles, for lighting
🔹 Report damages to local authorities

**EMERGENCY CONTACTS:**
📞 Emergency Services: 108
📞 Coast Guard: 1554
📞 INCOIS Helpline: +91-40-23886047
📞 Disaster Management: Contact local authorities

**COASTAL COMMUNITY PRECAUTIONS:**
🌊 Know tsunami evacuation zones and routes
🌊 Understand warning signals and sirens
🌊 Keep boats and fishing equipment secured
🌊 Have marine radio for emergency communication
🌊 Know locations of community shelters

⚠️ For specific guidance during active events, contact INCOIS emergency services immediately.`;
    }
  }
}

export const geminiService = new GeminiService();
