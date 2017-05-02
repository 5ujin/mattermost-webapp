// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {batchActions} from 'redux-batched-actions';

import {Client4} from 'client';
import {FileTypes} from 'action_types';
import {getLogErrorAction} from './errors';
import {forceLogoutIfNecessary} from './helpers';
import {parseClientIdsFromFormData} from 'utils/file_utils';

export function getFilesForPost(postId) {
    return async (dispatch, getState) => {
        dispatch({type: FileTypes.FETCH_FILES_FOR_POST_REQUEST}, getState);
        let files;

        try {
            files = await Client4.getFileInfosForPost(postId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: FileTypes.FETCH_FILES_FOR_POST_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        dispatch(batchActions([
            {
                type: FileTypes.RECEIVED_FILES_FOR_POST,
                data: files,
                postId
            },
            {
                type: FileTypes.FETCH_FILES_FOR_POST_SUCCESS
            }
        ]), getState);
    };
}

export function uploadFile(channelId, rootId, fileFormData, formBoundary) {
    return async (dispatch, getState) => {
        dispatch({type: FileTypes.UPLOAD_FILES_REQUEST}, getState);

        let files;
        try {
            files = await Client4.uploadFile(fileFormData, formBoundary);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([{
                type: FileTypes.UPLOAD_FILES_FAILURE,
                clientIds: parseClientIdsFromFormData(fileFormData),
                channelId,
                rootId,
                error
            },
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        const data = files.file_infos.map((file, index) => {
            return {
                ...file,
                clientId: files.client_ids[index]
            };
        });

        dispatch(batchActions([
            {
                type: FileTypes.RECEIVED_UPLOAD_FILES,
                data,
                channelId,
                rootId
            },
            {
                type: FileTypes.UPLOAD_FILES_SUCCESS
            }
        ]), getState);
    };
}
