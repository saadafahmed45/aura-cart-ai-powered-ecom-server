import SliderConfig from '../models/SliderConfig.js';

// @desc    Get slider config (public)
// @route   GET /api/v1/slider-config
// @access  Public
export const getSliderConfig = async (req, res, next) => {
  try {
    let config = await SliderConfig.findOne();
    if (!config) {
      config = await SliderConfig.create({});
    }
    res.status(200).json({ success: true, config });
  } catch (error) {
    next(error);
  }
};

// @desc    Update slider config (admin)
// @route   PUT /api/v1/slider-config
// @access  Private/Admin
export const updateSliderConfig = async (req, res, next) => {
  try {
    const { height, autoplayInterval, overlayOpacity, overlayColor, objectFit, contentMaxWidth, contentAlign } = req.body;

    let config = await SliderConfig.findOne();
    if (!config) {
      config = new SliderConfig();
    }

    if (height !== undefined) config.height = height;
    if (autoplayInterval !== undefined) config.autoplayInterval = autoplayInterval;
    if (overlayOpacity !== undefined) config.overlayOpacity = overlayOpacity;
    if (overlayColor !== undefined) config.overlayColor = overlayColor;
    if (objectFit !== undefined) config.objectFit = objectFit;
    if (contentMaxWidth !== undefined) config.contentMaxWidth = contentMaxWidth;
    if (contentAlign !== undefined) config.contentAlign = contentAlign;

    await config.save();

    res.status(200).json({ success: true, config });
  } catch (error) {
    next(error);
  }
};
