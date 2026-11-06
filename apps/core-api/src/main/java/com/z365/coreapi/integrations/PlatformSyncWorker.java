package com.z365.coreapi.integrations;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration(proxyBeanMethods = false)
@EnableScheduling
@ConditionalOnProperty(name = "z365.integrations.sync-enabled", havingValue = "true", matchIfMissing = true)
class PlatformSyncWorker {
    private static final Logger log = LoggerFactory.getLogger(PlatformSyncWorker.class);
    private final PlatformService platforms;
    private final PublicPlatformClient client;

    PlatformSyncWorker(PlatformService platforms, PublicPlatformClient client) {
        this.platforms = platforms;
        this.client = client;
    }

    @Scheduled(fixedDelay = 2500)
    void refresh() {
        platforms.claim().ifPresent(claim -> {
            try {
                platforms.storeSync(claim, client.fetch(claim));
            } catch (PublicPlatformClient.IdentityChanged changed) {
                platforms.revoke(claim, changed.getMessage());
            } catch (PublicPlatformClient.ProviderFailure failure) {
                platforms.fail(claim, failure);
                log.warn("Platform sync failed for {}. Retryable: {}", claim.platform(), failure.retryable);
            } catch (DuplicateKeyException conflict) {
                platforms.fail(claim, new PublicPlatformClient.ProviderFailure(
                        "This provider account is already connected to another Z365 user.", false, 0));
            }
        });
    }
}
