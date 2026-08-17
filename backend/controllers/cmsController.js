/**
 * CMS & Content Management Controller
 * Static Pages and Banner Management
 * Agrawal Matrimony Platform
 */

const { CMSPage, Banner } = require('../models/CMS');
const auditService = require('../services/auditService');
const { success, created, badRequest, notFound } = require('../utils/apiResponse');

// --- PUBLIC CMS ENDPOINTS ---

/**
 * 1. Public: Get Single CMS Page by Key
 * GET /api/cms/pages/:key
 */
const getPageByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    const cleanKey = String(key).trim().toLowerCase();

    const page = await CMSPage.findOne({ key: cleanKey, isActive: true });
    if (!page) {
      return notFound(res, `CMS page not found with key: ${key}`);
    }

    return success(res, `Page "${page.title}" retrieved successfully`, { page });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Public: Get All Active CMS Pages (Summary)
 * GET /api/cms/pages
 */
const getAllPages = async (req, res, next) => {
  try {
    const pages = await CMSPage.find({ isActive: true })
      .select('key title metaDescription updatedAt lastUpdated')
      .sort({ title: 1 });

    return success(res, 'CMS pages retrieved successfully', {
      pages,
      count: pages.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Public: Get Active Homepage Banners
 * GET /api/cms/banners
 */
const getActiveBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 });

    return success(res, 'Active banners retrieved successfully', {
      banners,
      count: banners.length
    });
  } catch (error) {
    next(error);
  }
};

// --- ADMIN CMS ENDPOINTS ---

/**
 * 4. Admin: Update or Upsert CMS Static Page
 * PUT /api/admin/cms/pages/:key
 */
const updatePage = async (req, res, next) => {
  try {
    const { key } = req.params;
    const cleanKey = String(key).trim().toLowerCase();
    const { title, content, points, metaDescription, isActive } = req.body;

    let page = await CMSPage.findOne({ key: cleanKey });

    const adminId = req.admin ? req.admin.adminId : null;
    const adminName = req.admin ? req.admin.name : 'Super Admin';
    const adminRole = req.admin ? req.admin.role : 'Super Admin';

    const isNew = !page;

    if (!page) {
      if (!title) {
        return badRequest(res, 'Title is required when creating a new CMS page');
      }
      page = new CMSPage({
        key: cleanKey,
        title: title.trim(),
        content: content || '',
        points: points || [],
        metaDescription: metaDescription || '',
        isActive: isActive !== undefined ? isActive : true,
        updatedBy: adminId,
        updatedByName: adminName,
        lastUpdated: new Date()
      });
    } else {
      if (title !== undefined) page.title = title.trim();
      if (content !== undefined) page.content = content;
      if (points !== undefined) page.points = points;
      if (metaDescription !== undefined) page.metaDescription = metaDescription;
      if (isActive !== undefined) page.isActive = isActive;
      page.updatedBy = adminId;
      page.updatedByName = adminName;
      page.lastUpdated = new Date();
    }

    await page.save();

    // Log immutable audit trail
    await auditService.logAction({
      adminId,
      adminName,
      adminRole,
      action: isNew ? 'Created CMS Page' : 'Updated CMS Page',
      target: `CMS Page: ${cleanKey}`,
      details: `${isNew ? 'Created' : 'Updated'} CMS page "${page.title}" (${cleanKey})`,
      ipAddress: req.ip,
      metadata: {
        pageKey: cleanKey,
        title: page.title,
        isNew
      }
    });

    return success(res, `CMS page "${page.title}" saved successfully`, { page });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Admin: List All CMS Pages (Including Inactive)
 * GET /api/admin/cms/pages
 */
const getAdminPages = async (req, res, next) => {
  try {
    const pages = await CMSPage.find().sort({ updatedAt: -1 });
    return success(res, 'All CMS pages retrieved successfully', {
      pages,
      count: pages.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Admin: Create Banner
 * POST /api/admin/banners
 */
const createBanner = async (req, res, next) => {
  try {
    const { title, subtitle = '', imageUrl, targetUrl = '', isActive = true, sortOrder = 0 } = req.body;

    if (!title || !imageUrl) {
      return badRequest(res, 'Both banner title and imageUrl are required');
    }

    const adminId = req.admin ? req.admin.adminId : null;
    const adminName = req.admin ? req.admin.name : 'Super Admin';
    const adminRole = req.admin ? req.admin.role : 'Super Admin';

    const banner = new Banner({
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : '',
      imageUrl: imageUrl.trim(),
      targetUrl: targetUrl ? targetUrl.trim() : '',
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: Number(sortOrder) || 0,
      createdBy: adminId,
      updatedBy: adminId
    });

    await banner.save();

    // Log immutable audit trail
    await auditService.logAction({
      adminId,
      adminName,
      adminRole,
      action: 'Created Banner',
      target: banner._id.toString(),
      details: `Created new banner "${banner.title}" (sortOrder: ${banner.sortOrder})`,
      ipAddress: req.ip,
      metadata: {
        bannerId: banner._id,
        title: banner.title,
        sortOrder: banner.sortOrder
      }
    });

    return created(res, 'Banner created successfully', { banner });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Admin: Update Banner
 * PUT /api/admin/banners/:id
 */
const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, subtitle, imageUrl, targetUrl, isActive, sortOrder } = req.body;

    const banner = await Banner.findById(id);
    if (!banner) {
      return notFound(res, `Banner not found with ID: ${id}`);
    }

    const adminId = req.admin ? req.admin.adminId : null;
    const adminName = req.admin ? req.admin.name : 'Super Admin';
    const adminRole = req.admin ? req.admin.role : 'Super Admin';

    if (title !== undefined) banner.title = title.trim();
    if (subtitle !== undefined) banner.subtitle = subtitle.trim();
    if (imageUrl !== undefined) banner.imageUrl = imageUrl.trim();
    if (targetUrl !== undefined) banner.targetUrl = targetUrl.trim();
    if (isActive !== undefined) banner.isActive = isActive;
    if (sortOrder !== undefined) banner.sortOrder = Number(sortOrder);
    banner.updatedBy = adminId;

    await banner.save();

    // Log immutable audit trail
    await auditService.logAction({
      adminId,
      adminName,
      adminRole,
      action: 'Updated Banner',
      target: banner._id.toString(),
      details: `Updated banner "${banner.title}"`,
      ipAddress: req.ip,
      metadata: {
        bannerId: banner._id,
        title: banner.title,
        isActive: banner.isActive
      }
    });

    return success(res, 'Banner updated successfully', { banner });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Admin: Delete Banner
 * DELETE /api/admin/banners/:id
 */
const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return notFound(res, `Banner not found with ID: ${id}`);
    }

    const bannerTitle = banner.title;
    await Banner.findByIdAndDelete(id);

    const adminId = req.admin ? req.admin.adminId : null;
    const adminName = req.admin ? req.admin.name : 'Super Admin';
    const adminRole = req.admin ? req.admin.role : 'Super Admin';

    // Log immutable audit trail
    await auditService.logAction({
      adminId,
      adminName,
      adminRole,
      action: 'Deleted Banner',
      target: id,
      details: `Deleted banner "${bannerTitle}"`,
      ipAddress: req.ip,
      metadata: {
        bannerId: id,
        title: bannerTitle
      }
    });

    return success(res, `Banner "${bannerTitle}" deleted successfully`, {
      deletedBannerId: id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 9. Admin: List All Banners (Including Inactive)
 * GET /api/admin/banners
 */
const getAdminBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 });
    return success(res, 'All banners retrieved successfully', {
      banners,
      count: banners.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPageByKey,
  getAllPages,
  getActiveBanners,
  updatePage,
  getAdminPages,
  createBanner,
  updateBanner,
  deleteBanner,
  getAdminBanners
};
