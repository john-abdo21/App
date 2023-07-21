import {useCallback, useEffect, useRef} from 'react';
import _ from 'underscore';

import variables from '../../styles/variables';
import DragAndDropPropTypes from './dragAndDropPropTypes';
import withNavigationFocus from '../withNavigationFocus';
import usePrevious from '../../hooks/usePrevious';

const COPY_DROP_EFFECT = 'copy';
const NONE_DROP_EFFECT = 'none';

const DRAG_ENTER_EVENT = 'dragenter';
const DRAG_LEAVE_EVENT = 'dragleave';
const DROP_EVENT = 'drop';
const RESIZE_EVENT = 'resize';

const defaultProps = {
    shouldAcceptDrop: (e) => {
        if (e.dataTransfer.types) {
            for (let i = 0; i < e.dataTransfer.types.length; i++) {
                if (e.dataTransfer.types[i] === 'Files') {
                    return true;
                }
            }
        }
        return false;
    },
    isDisabled: false,
};

function DragAndDrop({onDragEnter, onDragLeave, onDrop, dropZoneId, activeDropZoneId, shouldAcceptDrop, isDisabled, isFocused, children}) {
    const prevIsFocused = usePrevious(isFocused);
    const prevIsDisabled = usePrevious(isDisabled);
    const dropZone = useRef(null);
    const dropZoneRect = useRef(null);
    /*
        Last detected drag state on the dropzone -> we start with dragleave since user is not dragging initially.
        This state is updated when drop zone is left/entered entirely(not taking the children in the account) or entire window is left
    */
    const dropZoneDragState = useRef(DRAG_LEAVE_EVENT);

    const calculateDropZoneClientReact = useCallback(() => {
        const boundingClientRect = dropZone.current.getBoundingClientRect();

        // Handle edge case when we are under responsive breakpoint the browser doesn't normalize rect.left to 0 and rect.right to window.innerWidth
        return {
            width: boundingClientRect.width,
            left: window.innerWidth <= variables.mobileResponsiveWidthBreakpoint ? 0 : boundingClientRect.left,
            right: window.innerWidth <= variables.mobileResponsiveWidthBreakpoint ? window.innerWidth : boundingClientRect.right,
            top: boundingClientRect.top,
            bottom: boundingClientRect.bottom,
        };
    }, []);

    const dragNDropWindowResizeListener = () => {
        // Update bounding client rect on window resize
        dropZoneRect.current = calculateDropZoneClientReact();
    };

    const throttledDragNDropWindowResizeListener = _.throttle(dragNDropWindowResizeListener, 100);

    /**
     * @param {Object} event native Event
     */
    const dropZoneDragHandler = useCallback(
        (event) => {
            switch (event.type) {
                case DRAG_ENTER_EVENT:
                    // Avoid reporting onDragEnter for children views -> not performant
                    if (dropZoneDragState.current === DRAG_LEAVE_EVENT) {
                        dropZoneDragState.current = DRAG_ENTER_EVENT;
                        // eslint-disable-next-line no-param-reassign
                        event.dataTransfer.dropEffect = COPY_DROP_EFFECT;
                        onDragEnter(event);
                    }
                    break;
                case DRAG_LEAVE_EVENT:
                    if (dropZoneDragState.current === DRAG_ENTER_EVENT) {
                        if (
                            event.clientY <= dropZoneRect.current.top ||
                            event.clientY >= dropZoneRect.current.bottom ||
                            event.clientX <= dropZoneRect.current.left ||
                            event.clientX >= dropZoneRect.current.right ||
                            // Cancel drag when file manager is on top of the drop zone area - works only on chromium
                            (event.target.getAttribute('id') === activeDropZoneId && !event.relatedTarget)
                        ) {
                            dropZoneDragState.current = DRAG_LEAVE_EVENT;
                            onDragLeave(event);
                        }
                    }
                    break;
                case DROP_EVENT:
                    dropZoneDragState.current = DRAG_LEAVE_EVENT;
                    onDrop(event);
                    break;
                default:
                    break;
            }
        },
        [onDragEnter, onDragLeave, activeDropZoneId, onDrop],
    );

    /**
     * Handles all types of drag-N-drop events on the drop zone associated with composer
     *
     * @param {Object} event native Event
     */
    const dropZoneDragListener = useCallback(
        (event) => {
            event.preventDefault();

            if (dropZone.current.contains(event.target) && shouldAcceptDrop(event)) {
                dropZoneDragHandler(event);
            } else {
                // eslint-disable-next-line no-param-reassign
                event.dataTransfer.dropEffect = NONE_DROP_EFFECT;
            }
        },
        [shouldAcceptDrop, dropZoneDragHandler],
    );

    const addEventListeners = useCallback(() => {
        dropZone.current = document.getElementById(dropZoneId);
        dropZoneRect.current = calculateDropZoneClientReact();
        document.addEventListener(DRAG_ENTER_EVENT, dropZoneDragListener);
        document.addEventListener(DRAG_LEAVE_EVENT, dropZoneDragListener);
        document.addEventListener(DROP_EVENT, dropZoneDragListener);
        window.addEventListener(RESIZE_EVENT, throttledDragNDropWindowResizeListener);
    }, [dropZoneId, calculateDropZoneClientReact, dropZoneDragListener, throttledDragNDropWindowResizeListener]);

    const removeEventListeners = useCallback(() => {
        document.removeEventListener(DRAG_ENTER_EVENT, dropZoneDragListener);
        document.removeEventListener(DRAG_LEAVE_EVENT, dropZoneDragListener);
        document.removeEventListener(DROP_EVENT, dropZoneDragListener);
        window.removeEventListener(RESIZE_EVENT, throttledDragNDropWindowResizeListener);
    }, [dropZoneDragListener, throttledDragNDropWindowResizeListener]);

    useEffect(() => {
        if (isDisabled) {
            return;
        }
        addEventListeners();

        return removeEventListeners;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isFocused === prevIsFocused && isDisabled === prevIsDisabled) {
            return;
        }
        if (!isFocused || isDisabled) {
            removeEventListeners();
        } else {
            addEventListeners();
        }
    }, [isDisabled, isFocused, prevIsDisabled, prevIsFocused, addEventListeners, removeEventListeners]);

    return children;
}

DragAndDrop.propTypes = DragAndDropPropTypes;
DragAndDrop.defaultProps = defaultProps;

export default withNavigationFocus(DragAndDrop);
