
import { ERPAction } from './workflow';

export const parseAIResponseToActions = (aiResponse: any): ERPAction[] => {
  const actions: ERPAction[] = [];

  if (aiResponse.actions && Array.isArray(aiResponse.actions)) {
    return aiResponse.actions;
  }

  // Fallback: Manual mapping if actions array is missing but specific fields exist
  if (aiResponse.new_order || aiResponse.order) {
    actions.push({
      type: 'CREATE_ORDER',
      data: aiResponse.new_order || aiResponse.order
    });
  }

  if (aiResponse.customer_data?.phone && aiResponse.suggested_reply) {
    actions.push({
      type: 'SEND_NOTIFICATION',
      data: {
        phone: aiResponse.customer_data.phone,
        message: aiResponse.suggested_reply
      }
    });
  }

  return actions;
};
