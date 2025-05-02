function generatePaginationParams(pageNumber = 1, pageSize = 10) {
    const page = Math.max(1, parseInt(pageNumber));
    const limit = Math.max(1, parseInt(pageSize));
    const skip = (page - 1) * limit;
  
    return { skip, limit };
  }

module.exports = generatePaginationParams;