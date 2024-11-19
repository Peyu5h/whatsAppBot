import Hospital from '../models/Hospital.js';
import Booking from '../models/Booking.js';
import whatsappService from './whatsappService.js';

class ConversationService {
  constructor() {
    this.userStates = new Map();
  }

  async handleMessage(from, messageContent) {
    try {
      console.log('Processing message:', { from, messageContent });
  
      if (typeof messageContent === 'string') {
        if (messageContent.toLowerCase() === 'book hospital') {
          const hospitals = await Hospital.find().limit(5);
          if (!hospitals || hospitals.length === 0) {
            await whatsappService.sendTextMessage(from, 'No hospitals found. Please try again later.');
            return;
          }
          await whatsappService.sendHospitalList(from, hospitals);
        } else {
          await whatsappService.sendTextMessage(
            from,
            'Welcome to Medlink! Send "book hospital" to start booking.'
          );
        }
      }
      else if (messageContent?.type === 'interactive') {
        if (messageContent.listReply) {
          const selectedHospitalId = messageContent.listReply.id;
          const hospital = await Hospital.findById(selectedHospitalId);
          if (hospital) {
            await whatsappService.sendAmbulanceQuestion(from, hospital.name);
            this.userStates.set(from, {
              step: 'AMBULANCE_CONFIRMATION',
              hospitalId: selectedHospitalId
            });
          }
        } else if (messageContent.buttonReply) {
          const userState = this.userStates.get(from);
          if (userState?.step === 'AMBULANCE_CONFIRMATION') {
            const requiresAmbulance = messageContent.buttonReply.id === 'ambulance_yes';
            const booking = new Booking({
              userId: from,
              hospitalId: userState.hospitalId,
              requiresAmbulance
            });
            await booking.save();
            
            await whatsappService.sendTextMessage(
              from,
              `Booking confirmed! ${requiresAmbulance ? 'An ambulance will be dispatched.' : 'Please arrive at the hospital.'}`
            );
            this.userStates.delete(from);
          }
        }
      }
    } catch (error) {
      console.error('Message handling error:', error);
      await whatsappService.sendTextMessage(
        from,
        'Sorry, there was an error. Please try again.'
      );
    }
  }
}

export default new ConversationService(); 