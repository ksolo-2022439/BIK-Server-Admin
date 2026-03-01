using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BIK.AuditService.Data;
using BIK.AuditService.Models;
using BIK.AuditService.DTOs;

namespace BIK.AuditService.Controllers
{
    [ApiController]
    [Route("BIK/v1/[controller]")]
    public class AuditController : ControllerBase
    {
        private readonly AuditDbContext _context;

        public AuditController(AuditDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateLog([FromBody] AuditLogDto request)
        {
            try
            {
                var log = new AuditLog
                {
                    ActionType = request.ActionType,
                    Description = request.Description,
                    AccountId = request.AccountId,
                    UserId = request.UserId,
                    Severity = request.Severity,
                    SourceIpAddress = request.SourceIpAddress,
                    Timestamp = DateTime.UtcNow
                };

                _context.AuditLogs.Add(log);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Log de auditoría registrado correctamente." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetLogs()
        {
            var logs = await _context.AuditLogs
                                     .OrderByDescending(l => l.Timestamp)
                                     .Take(100)
                                     .ToListAsync();
            return Ok(logs);
        }
    }
}