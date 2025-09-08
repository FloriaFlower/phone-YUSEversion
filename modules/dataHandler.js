/**
 * 欲色剧场 (Theater App) 专属数据模块
 * 负责提供默认的数据结构。
 */

// 当世界书中的数据为空或损坏时，我们将使用这个函数来提供一个安全的默认结构
// 这可以防止App因缺少数据而崩溃。
export function getEmptyTheaterData() {
    return {
        announcements: [],
        customizations: [],
        theater_list: {
            all_films: [],
            hot: [],
            new: [],
            recommended: [],
            paid: []
        },
        shop: []
    };
}
