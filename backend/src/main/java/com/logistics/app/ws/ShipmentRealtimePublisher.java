package com.logistics.app.ws;

import com.logistics.app.dto.ShipmentDtos;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class ShipmentRealtimePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public ShipmentRealtimePublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishShipmentUpdated(ShipmentDtos.ShipmentResponse response) {
        messagingTemplate.convertAndSend("/topic/shipments", response);
        messagingTemplate.convertAndSend("/topic/shipments/" + response.getId(), response);
    }
}
