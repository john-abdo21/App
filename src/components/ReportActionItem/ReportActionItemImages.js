import React from 'react';
import {View} from 'react-native';
import PropTypes from 'prop-types';
import _ from 'underscore';
import styles from '../../styles/styles';
import Text from '../Text';
import ReportActionItemImage from './ReportActionItemImage';

const propTypes = {
    /** array of image and thumbnail URIs */
    images: PropTypes.arrayOf(
        PropTypes.shape({
            thumbnail: PropTypes.string,
            image: PropTypes.string,
        }),
    ).isRequired,

    // We're not providing default values for size and total and disabling the ESLint rule
    // because we want them to default to the length of images, but we can't set default props
    // to be computed from another prop

    /** max number of images to show in the row if different than images length */
    // eslint-disable-next-line react/require-default-props
    size: PropTypes.number,

    /** total number of images if different than images length */
    // eslint-disable-next-line react/require-default-props
    total: PropTypes.number,

    /** if the corresponding report action item is hovered */
    isHovered: PropTypes.boolean,
};

const defaultProps = {
    isHovered: false,
};

function ReportActionItemImages({images, size, total, isHovered}) {
    const numberOfShownImages = size || images.length;
    const shownImages = images.slice(0, size);
    const remaining = (total || images.length) - size;

    const hoverStyle = isHovered ? styles.reportPreviewBoxHoverBorder : undefined;
    return (
        <View style={[styles.reportActionItemImages, hoverStyle]}>
            {_.map(shownImages, ({thumbnail, image}, index) => {
                const isLastImage = index === numberOfShownImages - 1;
                return (
                    <View
                        key={image}
                        style={[styles.reportActionItemImage, hoverStyle]}
                    >
                        <ReportActionItemImage
                            thumbnail={thumbnail}
                            image={image}
                        />
                        {isLastImage && remaining > 0 && (
                            <View style={[styles.reportActionItemImagesMore, hoverStyle]}>
                                <Text>+{remaining}</Text>
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

ReportActionItemImages.propTypes = propTypes;
ReportActionItemImages.defaultProps = defaultProps;
ReportActionItemImages.displayName = 'ReportActionItemImages';

export default ReportActionItemImages;