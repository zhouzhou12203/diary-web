-- Development-only seed data.
-- Do not run this file against production data.

INSERT INTO diary_entries (title, content, content_type, mood, weather, tags, images, location) VALUES
('公园散步的美好时光', '今天天气很好，和朋友一起去**公园散步**，心情特别愉快。

看到了很多美丽的花朵 🌸，还遇到了可爱的小狗 🐕。和朋友聊了很多有趣的话题。

> 生活中的小美好总是让人感到幸福', 'markdown', 'happy', 'sunny', '["散步", "朋友", "公园"]', '[]', '{"name": "中央公园", "address": "市中心公园路1号"}'),

('工作中的成长与收获', '今天在工作中遇到了一些挑战，但通过**团队合作**成功解决了问题。

学到了很多新的技术知识：
- React Hook 的高级用法
- TypeScript 类型推导
- 团队协作的重要性

感觉自己又成长了一些 💪', 'markdown', 'neutral', 'cloudy', '["工作", "学习", "团队"]', '[]', '{"name": "科技园办公楼", "address": "高新区科技大道88号"}'),

('雨天的宁静思考', '下雨天总是让人感到宁静，坐在窗边听雨声，思考人生的意义。

今天读了《人生的智慧》，收获颇丰。

*雨声滴答，思绪万千...*

有时候慢下来，静静地感受生活，也是一种幸福。', 'markdown', 'peaceful', 'rainy', '["读书", "思考", "雨天"]', '[]', NULL);

INSERT OR REPLACE INTO app_settings (setting_key, setting_value) VALUES
('app_password_enabled', 'false'),
('quick_filters_enabled', 'true'),
('export_enabled', 'true'),
('archive_view_enabled', 'true'),
('welcome_page_enabled', 'true'),
('admin_password_hash', 'pbkdf2$150000$6ba5d5714ee14b39800983549767cb30$YyH2dsSiDpM1GlugqVJgOzUwL_0D83BDo0Fbfrdgm20'),
('app_password_hash', 'pbkdf2$150000$b6f24ad9613246a8bf245bb0df1f4de3$ib4tKi4fNKhJElJzBjCBgNtGuRz-GH90uxxn0Ia9LsI');
