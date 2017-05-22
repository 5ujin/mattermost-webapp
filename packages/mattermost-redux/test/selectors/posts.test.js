// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import {makeGetPostsForThread, getReactionsForPost} from 'selectors/entities/posts';
import {makeGetProfilesForReactions} from 'selectors/entities/users';
import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import TestHelper from 'test/test_helper';

describe('Selectors.Posts', () => {
    describe('makeGetPostsForThread', () => {
        const user1 = TestHelper.fakeUserWithId();
        const profiles = {};
        profiles[user1.id] = user1;

        const posts = {
            a: {id: 'a', channel_id: '1'},
            b: {id: 'b', channel_id: '1'},
            c: {id: 'c', root_id: 'a', channel_id: '1'},
            d: {id: 'd', root_id: 'b', channel_id: '1'},
            e: {id: 'e', root_id: 'a', channel_id: '1'},
            f: {id: 'f', channel_id: 'f'}
        };

        const reaction1 = {user_id: user1.id, emoji_name: '+1'};
        const reactions = {
            a: {[reaction1.user_id + '-' + reaction1.emoji_name]: reaction1}
        };

        const testState = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: user1.id,
                    profiles
                },
                posts: {
                    posts,
                    postsInChannel: {
                        1: ['a', 'b', 'c', 'd', 'e', 'f']
                    },
                    reactions
                }
            }
        });

        it('should return single post with no children', () => {
            const getPostsForThread = makeGetPostsForThread();

            assert.deepEqual(getPostsForThread(testState, {channelId: '1', rootId: 'f'}), [posts.f]);
        });

        it('should return post with children', () => {
            const getPostsForThread = makeGetPostsForThread();

            assert.deepEqual(getPostsForThread(testState, {channelId: '1', rootId: 'a'}), [posts.a, posts.c, posts.e]);
        });

        it('should return memoized result for identical props', () => {
            const getPostsForThread = makeGetPostsForThread();

            const props = {channelId: '1', rootId: 'a'};
            const result = getPostsForThread(testState, props);

            assert.equal(result, getPostsForThread(testState, props));
        });

        it('should return different result for different props', () => {
            const getPostsForThread = makeGetPostsForThread();

            const result = getPostsForThread(testState, {channelId: '1', rootId: 'a'});

            assert.notEqual(result, getPostsForThread(testState, {channelId: '1', rootId: 'a'}));
            assert.deepEqual(result, getPostsForThread(testState, {channelId: '1', rootId: 'a'}));
        });

        it('should return memoized result for multiple selectors with different props', () => {
            const getPostsForThread1 = makeGetPostsForThread();
            const getPostsForThread2 = makeGetPostsForThread();

            const props1 = {channelId: '1', rootId: 'a'};
            const result1 = getPostsForThread1(testState, props1);

            const props2 = {channelId: '1', rootId: 'b'};
            const result2 = getPostsForThread2(testState, props2);

            assert.equal(result1, getPostsForThread1(testState, props1));
            assert.equal(result2, getPostsForThread2(testState, props2));
        });

        it('should return reactions for post', () => {
            assert.deepEqual(getReactionsForPost(testState, posts.a.id), [reaction1]);
        });

        it('should return profiles for reactions', () => {
            const getProfilesForReactions = makeGetProfilesForReactions();
            assert.deepEqual(getProfilesForReactions(testState, [reaction1]), [user1]);
        });
    });
});
