package com.z365.coreapi.challenges.service;

import com.z365.coreapi.challenges.domain.ChallengeStatus;
import com.z365.coreapi.challenges.domain.Difficulty;
import com.z365.coreapi.challenges.web.dto.ChallengeResponse;
import com.z365.coreapi.challenges.web.dto.CreateChallengeRequest;

import java.util.List;

public interface ChallengeService {

    List<ChallengeResponse> getChallenges(Difficulty difficulty, ChallengeStatus status);

    ChallengeResponse getChallengeById(String id);

    ChallengeResponse getChallengeBySlug(String slug);

    ChallengeResponse createChallenge(CreateChallengeRequest request);
}

