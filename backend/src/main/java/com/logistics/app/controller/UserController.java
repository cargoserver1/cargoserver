package com.logistics.app.controller;

import com.logistics.app.dto.UserDtos;
import com.logistics.app.entity.User;
import com.logistics.app.service.AuthService;
import com.logistics.app.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @GetMapping("/me/profile")
    public UserDtos.ProfileResponse myProfile(Authentication authentication) {
        return userService.getMyProfile(currentUser(authentication));
    }

    @PutMapping("/me/profile")
    public UserDtos.ProfileResponse updateMyProfile(@RequestBody UserDtos.UpdateProfileRequest request, Authentication authentication) {
        return userService.updateMyProfile(currentUser(authentication), request);
    }


    @PostMapping(value = "/me/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserDtos.ProfileImageUploadResponse uploadMyProfileImage(@RequestParam("file") MultipartFile file,
                                                                    Authentication authentication) {
        UserDtos.ProfileImageUploadResponse uploaded = userService.uploadProfileImage(currentUser(authentication), file);
        return UserDtos.ProfileImageUploadResponse.builder()
                .imageUrl(ServletUriComponentsBuilder.fromCurrentContextPath().path(uploaded.getImageUrl()).toUriString())
                .originalFilename(uploaded.getOriginalFilename())
                .build();
    }

    @GetMapping("/public-search")
    public List<UserDtos.PublicUserListItem> publicUsers(
            @RequestParam String role,
            @RequestParam(required = false, defaultValue = "") String keyword,
            Authentication authentication
    ) {
        Long excludeUserId = null;

        if (authentication != null && authentication.getName() != null) {
            User loginUser = authService.getCurrentUser(authentication.getName());
            if (loginUser != null) {
                excludeUserId = loginUser.getId();
            }
        }

        return userService.searchPublicUsers(role, keyword, excludeUserId);
    }

    @GetMapping("/{userId}/public-profile")
    public UserDtos.PublicProfileResponse publicProfile(@PathVariable Long userId) {
        return userService.getPublicProfile(userId);
    }

    private User currentUser(Authentication authentication) {
        return authService.getCurrentUser(authentication.getName());
    }
}