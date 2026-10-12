const assert = require('node:assert/strict');
const test = require('node:test');

// Stub only the database boundary and legacy controller responses. Exercise the
// production server's mount order without connecting to any application database.
test('module mount preserves legacy subgroup and timetable preview endpoints', async () => {
  require.cache[require.resolve('../../config/db')] = { exports: () => {} };
  require.cache[require.resolve('../../controllers/coordinatorController')] = {
    exports: {
      getSubgroups: (req, res) => res.json({ courseCode: req.params.courseCode }),
      previewTimetable: (req, res) => res.json({ courseIds: req.body.courseIds }),
    },
  };
  const app = require('../../server');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const base = `http://127.0.0.1:${server.address().port}/api/coordinator`;
  try {
    const legacy = await fetch(`${base}/subgroups/IT100`);
    assert.equal(legacy.status, 200);
    assert.deepEqual(await legacy.json(), { courseCode: 'IT100' });
    const preview = await fetch(`${base}/preview-timetable`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseIds: ['IT100'] }),
    });
    assert.equal(preview.status, 200);
    assert.deepEqual(await preview.json(), { courseIds: ['IT100'] });
    assert.equal((await fetch(`${base}/module/health`)).status, 200);
    assert.equal((await fetch(`${base}/module/subgroups/507f1f77bcf86cd799439011`)).status, 401);
    assert.equal((await fetch(`${base}/module/timetables`)).status, 401);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
