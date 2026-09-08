package com.cyvanta.affiliate_app;

import com.cyvanta.affiliate_app.controller.StoreController;
import com.cyvanta.affiliate_app.model.Store;
import com.cyvanta.affiliate_app.repository.StoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class StoreControllerTest {

    private StoreRepository storeRepository;
    private StoreController storeController;

    @BeforeEach
    void setUp() {
        storeRepository = mock(StoreRepository.class);
        storeController = new StoreController(storeRepository);
    }

    @Test
    void testCreateStoreSetsDefaultActiveAndApproved() {
        Store input = new Store();
        input.setName("New Trendy Shop");

        when(storeRepository.save(any(Store.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<Store> response = storeController.createStore(input);
        assertNotNull(response.getBody());
        Store saved = response.getBody();

        assertEquals("active", saved.getStatus());
        assertEquals(Integer.valueOf(1), saved.getIs_approved());
        assertTrue(saved.getIsApproved());
        assertEquals(Integer.valueOf(1), saved.getIs_active());
        assertTrue(saved.getIsActive());
        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getLogo());
        assertTrue(saved.getLogo().startsWith("data:image/svg+xml"));
    }

    @Test
    void testGetAllStoresReturnsLatestFirst() {
        Store oldStore = new Store();
        oldStore.setId("store-1");
        oldStore.setName("Old Store");
        oldStore.setStatus("active");
        oldStore.setCreatedAt(LocalDateTime.now().minusDays(5));

        Store newStore = new Store();
        newStore.setId("store-2");
        newStore.setName("Brand New Store");
        newStore.setStatus("active");
        newStore.setCreatedAt(LocalDateTime.now());

        List<Store> repoList = new ArrayList<>(List.of(oldStore, newStore));
        when(storeRepository.findAllByOrderByCreatedAtDesc()).thenReturn(repoList);

        ResponseEntity<List<Store>> response = storeController.getAllStores(null, null, null, null);
        assertNotNull(response.getBody());
        List<Store> result = response.getBody();

        assertEquals(2, result.size());
        // Verify newest store is first (latest())
        assertEquals("store-2", result.get(0).getId());
        assertEquals("store-1", result.get(1).getId());
    }

    @Test
    void testGetAllStoresDoesNotBlockWithPendingFilter() {
        Store activeStore = new Store();
        activeStore.setId("store-active");
        activeStore.setName("Active Store");
        activeStore.setStatus("active");
        activeStore.setIs_approved(1);
        activeStore.setCreatedAt(LocalDateTime.now());

        when(storeRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(activeStore));

        // When requesting active stores, it should include active and approved stores
        ResponseEntity<List<Store>> response = storeController.getAllStores("active", 1, true, 1);
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("Active Store", response.getBody().get(0).getName());
    }

    @Test
    void testGetActiveStoresCallsGetAllStores() {
        Store activeStore = new Store();
        activeStore.setId("store-active-2");
        activeStore.setName("Active Store 2");
        activeStore.setStatus("active");
        activeStore.setCreatedAt(LocalDateTime.now());

        when(storeRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(activeStore));

        ResponseEntity<List<Store>> response = storeController.getActiveStores();
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("Active Store 2", response.getBody().get(0).getName());
    }
}
